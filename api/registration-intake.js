import Stripe from 'stripe'
import admin from 'firebase-admin'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const cleanEmail = value => String(value || '').trim().toLowerCase()
const idOf = value => typeof value === 'string' ? value : value?.id || null
const stamp = () => admin.firestore.FieldValue.serverTimestamp()
function db() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  }) })
  return admin.firestore()
}
async function paymentRefFor(database, email, sessionId) {
  const ref = database.collection('pendingPayments').doc(sessionId)
  if ((await ref.get()).exists) return ref
  const legacy = database.collection('pendingPayments').doc(encodeURIComponent(email))
  const snap = await legacy.get()
  return snap.exists && snap.data().stripeSessionId === sessionId ? legacy : ref
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' })
  try {
    const sessionId = String(req.body?.sessionId || req.body?.session_id || '').trim()
    if (!/^cs_(test_|live_)[a-zA-Z0-9]+$/.test(sessionId)) return res.status(400).json({ error: 'Referencia de pago inválida.' })
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.status !== 'complete' || session.payment_status !== 'paid') return res.status(403).json({ error: 'El pago aún no está confirmado.' })
    if (!['payment', 'subscription'].includes(session.mode)) return res.status(403).json({ error: 'Modalidad de pago no admitida.' })
    const email = cleanEmail(session.customer_details?.email || session.customer_email)
    if (!email) return res.status(422).json({ error: 'Stripe no proporcionó correo.' })
    const database = db()
    const paymentRef = await paymentRefFor(database, email, sessionId)
    const paymentSnap = await paymentRef.get()
    if (!paymentSnap.exists) return res.status(409).json({ error: 'Estamos confirmando tu pago. Intenta nuevamente en unos segundos.' })
    const payment = paymentSnap.data()
    if (payment.stripeSessionId !== sessionId || !['paid', 'completed'].includes(payment.paymentStatus) || payment.accessStatus !== 'active') return res.status(403).json({ error: 'Esta compra no está autorizada para inscripción.' })
    if (payment.paymentUsed || payment.registrationCompleted) return res.status(403).json({ error: 'Esta compra ya fue utilizada.' })
    const customerId = idOf(session.customer)
    const subscriptionId = idOf(session.subscription)
    if ((payment.stripeCustomerId && payment.stripeCustomerId !== customerId) ||
        (payment.stripeSubscriptionId && payment.stripeSubscriptionId !== subscriptionId)) return res.status(403).json({ error: 'Los datos de Stripe no coinciden.' })
    if (session.mode === 'subscription') {
      if (!subscriptionId) return res.status(403).json({ error: 'No encontramos la suscripción.' })
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      if (!['active', 'trialing'].includes(subscription.status)) return res.status(403).json({ error: 'La suscripción no está activa.' })
    }
    const intakeRef = database.collection('registrationIntakes').doc(sessionId)
    const counterRef = database.collection('counters').doc('studentEnrollment')
    const record = await database.runTransaction(async tx => {
      const [intakeSnap, currentPayment, counterSnap] = await Promise.all([
        tx.get(intakeRef), tx.get(paymentRef), tx.get(counterRef)
      ])
      if (!currentPayment.exists || currentPayment.data().stripeSessionId !== sessionId ||
          currentPayment.data().paymentUsed === true || currentPayment.data().registrationCompleted === true) {
        throw new Error('El pago ya no está disponible para inscripción.')
      }
      if (intakeSnap.exists) {
        const existing = intakeSnap.data()
        if (!currentPayment.data().matricula) tx.update(paymentRef, { matricula: existing.matricula, updatedAt: stamp() })
        return existing
      }
      const next = Number(counterSnap.exists ? counterSnap.data().last || 0 : 0) + 1
      const year = new Date(session.created * 1000).getUTCFullYear()
      const matricula = `EQ-${year}-${String(next).padStart(5, '0')}`
      const data = { matricula, email, name: String(session.customer_details?.name || '').trim(),
        stripeSessionId: sessionId, currency: String(session.currency || '').toUpperCase(),
        amount: typeof session.amount_total === 'number' ? (session.amount_total / 100).toFixed(2) : null,
        status: 'pending_registration', createdAt: stamp() }
      tx.set(counterRef, { last: next }, { merge: true })
      tx.create(intakeRef, data)
      tx.update(paymentRef, { matricula, updatedAt: stamp() })
      return data
    })
    return res.status(200).json({ matricula: record.matricula, email: record.email,
      name: record.name || '', currency: record.currency, amount: record.amount })
  } catch (error) {
    console.error('Error en registration-intake:', error)
    return res.status(500).json({ error: 'No pudimos preparar tu inscripción. Intenta nuevamente.' })
  }
}
