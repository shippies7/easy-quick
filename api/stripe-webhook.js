
import Stripe from 'stripe'
import admin from 'firebase-admin'

export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Cantidades en centavos. Todos los precios recurrentes son mensuales.
// Las cantidades de 2 y 3 pagos son exhibiciones del curso completo.
// Los planes mensuales incluyen el cobro inicial: 10 pagos en total.
const RECURRING_PLANS = {
  mxn: {
    100000: 2, 110000: 2, 125000: 2, 225000: 2,
    83400: 3,
    35000: 10, 50000: 10, 80000: 10
  },
  usd: {
    6300: 2, 4200: 3, 1800: 10
  }
}

// Precios de pago único del catálogo. No se cancelan como suscripciones.
const ONE_TIME_PRICES = {
  mxn: new Set([120000, 200000, 220000, 250000, 450000]),
  usd: new Set([12500])
}

const timestamp = () => admin.firestore.FieldValue.serverTimestamp()
const idOf = value => typeof value === 'string' ? value : value?.id || null
const cleanEmail = value => String(value || '').trim().toLowerCase()
const emailDoc = email => encodeURIComponent(cleanEmail(email))

function initFirebase() {
  if (admin.apps.length) return admin.app()
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  })
}

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function invoiceSubscriptionId(invoice) {
  return idOf(invoice.subscription) ||
    idOf(invoice.parent?.subscription_details?.subscription) || null
}

async function customerEmail(customerId, fallback) {
  if (fallback) return cleanEmail(fallback)
  if (!customerId) return ''
  const customer = await stripe.customers.retrieve(customerId)
  return customer.deleted ? '' : cleanEmail(customer.email)
}

async function findPayment(db, subscriptionId, customerId, email) {
  if (subscriptionId) {
    const matches = await db.collection('pendingPayments')
      .where('stripeSubscriptionId', '==', subscriptionId).limit(2).get()
    if (!matches.empty) return matches.docs[0].ref
  }
  if (email) {
    const ref = db.collection('pendingPayments').doc(emailDoc(email))
    const snap = await ref.get()
    if (snap.exists && (!subscriptionId || snap.data().stripeSubscriptionId === subscriptionId)) return ref
  }
  // Nunca atribuir una factura solo por customerId: un cliente puede tener varias compras.
  return null
}

async function updateStudent(db, paymentRef, changes) {
  const snap = await paymentRef.get()
  const uid = snap.exists && snap.data().studentUid
  if (uid) await db.collection('students').doc(uid).set({ ...changes, updatedAt: timestamp() }, { merge: true })
}

async function subscriptionPlan(subscriptionId) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const items = subscription.items.data
  if (items.length !== 1 || (items[0].quantity || 1) !== 1) {
    throw new Error(`Suscripción ${subscriptionId}: cantidad de productos inesperada`)
  }
  const price = items[0].price
  const currency = String(price.currency || '').toLowerCase()
  const amount = price.unit_amount
  if (price.recurring?.interval !== 'month' || price.recurring?.interval_count !== 1) {
    throw new Error(`Periodicidad no reconocida para ${price.id}`)
  }
  const maximumPayments = RECURRING_PLANS[currency]?.[amount]
  if (!maximumPayments) throw new Error(`Precio recurrente no autorizado: ${price.id}`)
  return { subscription, price, currency, amount, maximumPayments }
}

async function scheduleEnd(plan) {
  const subscription = plan.subscription
  if (subscription.schedule) {
    const existing = await stripe.subscriptionSchedules.retrieve(idOf(subscription.schedule))
    if (existing.end_behavior !== 'cancel') {
      throw new Error(`La suscripción ${subscription.id} tiene un calendario no cancelable`)
    }
    return existing.id
  }

  const schedule = await stripe.subscriptionSchedules.create(
    { from_subscription: subscription.id },
    { idempotencyKey: `eq-school-schedule-${subscription.id}` }
  )
  const phase = schedule.phases?.[0]
  if (!phase?.start_date) throw new Error(`Calendario sin fase: ${schedule.id}`)

  // Una iteración equivale a un periodo mensual. El primero ya se factura al suscribirse.
  // La fase termina al concluir el periodo cubierto por el último cobro.
  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: 'cancel',
    phases: [{
      start_date: phase.start_date,
      items: [{ price: plan.price.id, quantity: 1 }],
      iterations: plan.maximumPayments
    }]
  })
  return schedule.id
}

async function checkoutCompleted(db, session) {
  if (session.payment_status !== 'paid') return
  const email = cleanEmail(session.customer_details?.email || session.customer_email)
  if (!email) throw new Error(`Checkout sin correo: ${session.id}`)
  const ref = db.collection('pendingPayments').doc(emailDoc(email))
  const previousSnap = await ref.get()
  const previous = previousSnap.exists ? previousSnap.data() : {}

  if (previous.stripeSessionId && previous.stripeSessionId !== session.id) {
    // La estructura actual usa el correo como ID. Evitar sobrescribir otra compra.
    throw new Error(`El correo ${email} ya tiene otra sesión; se requiere migración a documentos por sesión`)
  }

  const customerId = idOf(session.customer)
  const subscriptionId = idOf(session.subscription)
  let maximumPayments = null
  let priceId = null
  let amount = session.amount_total
  let currency = String(session.currency || '').toLowerCase()

  if (session.mode === 'subscription') {
    if (!subscriptionId) throw new Error(`Suscripción ausente: ${session.id}`)
    const plan = await subscriptionPlan(subscriptionId)
    maximumPayments = plan.maximumPayments
    priceId = plan.price.id
    amount = plan.amount
    currency = plan.currency
    await scheduleEnd(plan)
  } else if (session.mode === 'payment') {
    const lines = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 })
    if (lines.has_more || lines.data.length !== 1 || lines.data[0].quantity !== 1) {
      throw new Error(`Checkout con productos inesperados: ${session.id}`)
    }
    const price = lines.data[0].price
    priceId = price?.id || null
    const itemCurrency = String(price?.currency || '').toLowerCase()
    if (!price || price.type !== 'one_time' || !ONE_TIME_PRICES[itemCurrency]?.has(price.unit_amount)) {
      throw new Error(`Pago único no autorizado: ${session.id}`)
    }
    amount = price.unit_amount
    currency = itemCurrency
  } else {
    throw new Error(`Modo Checkout no permitido: ${session.mode}`)
  }

  const changes = {
    email, stripeSessionId: session.id, stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId, stripePriceId: priceId,
    mode: session.mode, amountTotal: amount, currency,
    planName: session.mode === 'payment'
      ? `Pago único ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
      : `${maximumPayments} pagos de ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`,
    maximumPayments, limitedPayments: Boolean(maximumPayments),
    paymentStatus: 'paid', // verify-payment.js requiere 'paid' para permitir el registro
    coursePaidInFull: session.mode === 'payment', accessStatus: 'active',
    paymentUsed: previous.paymentUsed || false,
    registrationCompleted: previous.registrationCompleted || false,
    updatedAt: timestamp()
  }
  await ref.set(changes, { merge: true })
  await updateStudent(db, ref, changes)
}

async function invoicePaid(db, invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice)
  if (!subscriptionId) return
  const customerId = idOf(invoice.customer)
  const email = await customerEmail(customerId, invoice.customer_email)
  const ref = await findPayment(db, subscriptionId, customerId, email)
  if (!ref) throw new Error(`Factura ${invoice.id} llegó antes del checkout o sin registro; Stripe reintentará`)
  const invoiceRef = db.collection('stripePaidInvoices').doc(invoice.id)
  let changes = null
  let uid = null

  await db.runTransaction(async tx => {
    const [seen, snap] = await Promise.all([tx.get(invoiceRef), tx.get(ref)])
    if (seen.exists) return
    if (!snap.exists || snap.data().stripeSubscriptionId !== subscriptionId) {
      throw new Error(`Suscripción distinta en factura ${invoice.id}`)
    }
    const payment = snap.data()
    const paymentsMade = Number(payment.paymentsMade || 0) + 1
    const max = Number(payment.maximumPayments || 0)
    const complete = max > 0 && paymentsMade >= max
    changes = {
      paymentsMade, lastInvoiceId: invoice.id,
      paymentStatus: complete ? 'completed' : 'paid',
      coursePaidInFull: complete, accessStatus: 'active',
      lastPaymentAt: timestamp(), updatedAt: timestamp()
    }
    uid = payment.studentUid || null
    tx.set(ref, changes, { merge: true })
    if (uid) tx.set(db.collection('students').doc(uid), changes, { merge: true })
    tx.create(invoiceRef, { subscriptionId, paymentRefId: ref.id, processedAt: timestamp() })
  })
}

async function paymentInterrupted(db, event) {
  const canceled = event.type === 'customer.subscription.deleted'
  const data = event.data.object
  const subscriptionId = canceled ? data.id : invoiceSubscriptionId(data)
  if (!subscriptionId) return
  const customerId = idOf(data.customer)
  const email = await customerEmail(customerId, data.customer_email)
  const ref = await findPayment(db, subscriptionId, customerId, email)
  if (!ref) throw new Error(`Sin registro para ${event.type}: ${subscriptionId}`)
  const snap = await ref.get()
  const payment = snap.data()
  const paidInFull = payment.coursePaidInFull === true || (
    Number(payment.maximumPayments || 0) > 0 &&
    Number(payment.paymentsMade || 0) >= Number(payment.maximumPayments)
  )
  const changes = paidInFull
    ? { paymentStatus: 'completed', coursePaidInFull: true, accessStatus: 'active' }
    : { paymentStatus: canceled ? 'canceled' : 'failed', accessStatus: 'suspended' }
  await ref.set({ ...changes, updatedAt: timestamp() }, { merge: true })
  await updateStudent(db, ref, changes)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  let event
  try {
    event = stripe.webhooks.constructEvent(
      await rawBody(req), req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error('Firma Stripe inválida:', error.message)
    return res.status(400).json({ error: 'Webhook inválido' })
  }
  try {
    initFirebase()
    const db = admin.firestore()
    const eventRef = db.collection('stripeWebhookEvents').doc(event.id)
    if ((await eventRef.get()).exists) return res.status(200).json({ received: true, duplicate: true })

    switch (event.type) {
      case 'checkout.session.completed':
        await checkoutCompleted(db, event.data.object)
        break
      case 'invoice.paid':
        await invoicePaid(db, event.data.object)
        break
      case 'invoice.payment_failed':
      case 'customer.subscription.deleted':
        await paymentInterrupted(db, event)
        break
      default:
        break
    }
    await eventRef.create({ type: event.type, processedAt: timestamp() })
    return res.status(200).json({ received: true })
  } catch (error) {
    if (error.code === 6 || error.code === 'already-exists') {
      return res.status(200).json({ received: true, duplicate: true })
    }
    console.error('Error procesando Stripe:', error)
    return res.status(500).json({ error: 'No se pudo procesar el evento' })
  }
}
