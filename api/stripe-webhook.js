import Stripe from 'stripe'
import admin from 'firebase-admin'

export const config = { api: { bodyParser: false } }
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const stamp = () => admin.firestore.FieldValue.serverTimestamp()
const idOf = value => typeof value === 'string' ? value : value?.id || null
const cleanEmail = value => String(value || '').trim().toLowerCase()
const RECURRING = {
  mxn: { 100000: 2, 110000: 2, 125000: 2, 225000: 2, 83400: 3, 35000: 10, 50000: 10, 80000: 10 },
  usd: { 6300: 2, 4200: 3, 1800: 10 }
}
const ONE_TIME = { mxn: new Set([120000, 200000, 220000, 250000, 450000]), usd: new Set([12500]) }

function db() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  }) })
  return admin.firestore()
}
function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}
function subscriptionFromInvoice(invoice) {
  return idOf(invoice.subscription) || idOf(invoice.parent?.subscription_details?.subscription) || null
}
async function paymentBySubscription(database, subscriptionId) {
  if (!subscriptionId) return null
  const found = await database.collection('pendingPayments').where('stripeSubscriptionId', '==', subscriptionId).limit(2).get()
  if (found.size > 1) throw new Error(`Más de un pago para suscripción ${subscriptionId}`)
  return found.empty ? null : found.docs[0].ref
}
async function updateStudent(database, paymentRef, changes) {
  const snap = await paymentRef.get()
  const uid = snap.data()?.studentUid
  if (!uid) return
  const studentRef = database.collection('students').doc(uid)
  const student = await studentRef.get()
  // No alterar la suscripción vigente de un alumno por una compra anterior.
  if (student.exists && student.data()?.stripeSessionId === snap.data()?.stripeSessionId) {
    await studentRef.set({ ...changes, updatedAt: stamp() }, { merge: true })
  }
}
async function configureSchedule(subscriptionId) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const items = subscription.items.data
  if (items.length !== 1 || (items[0].quantity || 1) !== 1) throw new Error('Suscripción con productos inesperados')
  const price = items[0].price
  const currency = String(price.currency || '').toLowerCase()
  const amount = price.unit_amount
  if (price.recurring?.interval !== 'month' || price.recurring?.interval_count !== 1) throw new Error('Periodicidad no autorizada')
  const maximumPayments = RECURRING[currency]?.[amount]
  if (!maximumPayments) throw new Error(`Precio recurrente no autorizado: ${price.id}`)
  if (subscription.schedule) {
    const schedule = await stripe.subscriptionSchedules.retrieve(idOf(subscription.schedule))
    if (schedule.end_behavior !== 'cancel') throw new Error('El calendario existente no cancela la suscripción')
  } else {
    const schedule = await stripe.subscriptionSchedules.create(
      { from_subscription: subscriptionId },
      { idempotencyKey: `eq-school-schedule-${subscriptionId}` }
    )
    const phase = schedule.phases?.[0]
    if (!phase?.start_date) throw new Error('Calendario sin fase')
    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: 'cancel',
      phases: [{ start_date: phase.start_date, items: [{ price: price.id, quantity: 1 }], iterations: maximumPayments }]
    })
  }
  return { maximumPayments, priceId: price.id, amount, currency }
}
async function checkoutCompleted(database, session) {
  if (session.status !== 'complete' || session.payment_status !== 'paid') return
  const email = cleanEmail(session.customer_details?.email || session.customer_email)
  if (!email) throw new Error(`Checkout sin correo: ${session.id}`)
  const ref = database.collection('pendingPayments').doc(session.id)
  const existing = await ref.get()
  const previous = existing.exists ? existing.data() : {}
  const subscriptionId = idOf(session.subscription)
  let amount, currency, priceId, maximumPayments = null
  if (session.mode === 'subscription') {
    if (!subscriptionId) throw new Error('Checkout sin suscripción')
    const plan = await configureSchedule(subscriptionId)
    ;({ amount, currency, priceId, maximumPayments } = plan)
  } else if (session.mode === 'payment') {
    const lines = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 })
    if (lines.has_more || lines.data.length !== 1 || lines.data[0].quantity !== 1) throw new Error('Productos inesperados')
    const price = lines.data[0].price
    currency = String(price?.currency || '').toLowerCase()
    amount = price?.unit_amount
    priceId = price?.id
    if (price?.type !== 'one_time' || !ONE_TIME[currency]?.has(amount)) throw new Error('Pago único no autorizado')
  } else throw new Error('Modo de compra no autorizado')
  const changes = {
    email, stripeSessionId: session.id, stripeCustomerId: idOf(session.customer),
    stripeSubscriptionId: subscriptionId, stripePriceId: priceId,
    mode: session.mode, amountTotal: amount, currency,
    planName: session.mode === 'payment' ? `Pago único ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}` : `${maximumPayments} pagos de ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`,
    maximumPayments, limitedPayments: Boolean(maximumPayments),
    paymentStatus: previous.paymentStatus === 'completed' ? 'completed' : 'paid',
    coursePaidInFull: session.mode === 'payment' || previous.coursePaidInFull === true,
    accessStatus: 'active', paymentUsed: previous.paymentUsed === true,
    registrationCompleted: previous.registrationCompleted === true,
    updatedAt: stamp()
  }
  await ref.set(changes, { merge: true })
  await updateStudent(database, ref, changes)
}
async function invoicePaid(database, invoice) {
  const subscriptionId = subscriptionFromInvoice(invoice)
  if (!subscriptionId) return
  const ref = await paymentBySubscription(database, subscriptionId)
  if (!ref) throw new Error(`Factura ${invoice.id} llegó antes del checkout; Stripe reintentará`)
  const invoiceRef = database.collection('stripePaidInvoices').doc(invoice.id)
  let update = null
  await database.runTransaction(async tx => {
    const [seen, snap] = await Promise.all([tx.get(invoiceRef), tx.get(ref)])
    if (seen.exists) return
    if (!snap.exists || snap.data().stripeSubscriptionId !== subscriptionId) throw new Error('Suscripción no coincide')
    const payment = snap.data()
    const paymentsMade = Number(payment.paymentsMade || 0) + 1
    const max = Number(payment.maximumPayments || 0)
    const complete = max > 0 && paymentsMade >= max
    update = { paymentsMade, lastInvoiceId: invoice.id,
      paymentStatus: complete ? 'completed' : 'paid', coursePaidInFull: complete,
      accessStatus: 'active', lastPaymentAt: stamp(), updatedAt: stamp() }
    tx.set(ref, update, { merge: true })
    tx.create(invoiceRef, { subscriptionId, paymentRefId: ref.id, processedAt: stamp() })
  })
  if (update) await updateStudent(database, ref, update)
}
async function paymentInterrupted(database, event) {
  const canceled = event.type === 'customer.subscription.deleted'
  const subscriptionId = canceled ? event.data.object.id : subscriptionFromInvoice(event.data.object)
  if (!subscriptionId) return
  const ref = await paymentBySubscription(database, subscriptionId)
  if (!ref) throw new Error(`No existe registro para ${subscriptionId}; Stripe reintentará`)
  const snap = await ref.get()
  const payment = snap.data()
  const paidInFull = payment.coursePaidInFull === true ||
    (Number(payment.maximumPayments || 0) > 0 && Number(payment.paymentsMade || 0) >= Number(payment.maximumPayments))
  const changes = paidInFull
    ? { paymentStatus: 'completed', coursePaidInFull: true, accessStatus: 'active' }
    : { paymentStatus: canceled ? 'canceled' : 'failed', accessStatus: 'suspended' }
  await ref.set({ ...changes, updatedAt: stamp() }, { merge: true })
  await updateStudent(database, ref, changes)
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  let event
  try {
    event = stripe.webhooks.constructEvent(await rawBody(req), req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error('Firma Stripe inválida:', error.message)
    return res.status(400).json({ error: 'Webhook inválido' })
  }
  try {
    const database = db()
    const eventRef = database.collection('stripeWebhookEvents').doc(event.id)
    if ((await eventRef.get()).exists) return res.status(200).json({ received: true, duplicate: true })
    switch (event.type) {
      case 'checkout.session.completed': await checkoutCompleted(database, event.data.object); break
      case 'invoice.paid': await invoicePaid(database, event.data.object); break
      case 'invoice.payment_failed':
      case 'customer.subscription.deleted': await paymentInterrupted(database, event); break
      default: break
    }
    await eventRef.create({ type: event.type, processedAt: stamp() })
    return res.status(200).json({ received: true })
  } catch (error) {
    if (error.code === 6 || error.code === 'already-exists') return res.status(200).json({ received: true, duplicate: true })
    console.error('Error procesando Stripe:', error)
    return res.status(500).json({ error: 'No se pudo procesar el evento' })
  }
}
