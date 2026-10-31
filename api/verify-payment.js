import Stripe from 'stripe'
import admin from 'firebase-admin'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const cleanEmail = value => String(value || '').trim().toLowerCase()
const idOf = value => typeof value === 'string' ? value : value?.id || null
function db() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  }) })
  return admin.firestore()
}
async function findPayment(database, email, sessionId) {
  const current = await database.collection('pendingPayments').doc(sessionId).get()
  if (current.exists) return current
  // Compatibilidad con pagos registrados antes de la migración.
  const legacy = await database.collection('pendingPayments').doc(encodeURIComponent(email)).get()
  return legacy.exists && legacy.data().stripeSessionId === sessionId ? legacy : current
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ valid: false, error: 'Método no permitido.' })
  try {
    const email = cleanEmail(req.body?.email)
    const sessionId = String(req.body?.sessionId || req.body?.session_id || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^cs_(test_|live_)[a-zA-Z0-9]+$/.test(sessionId)) {
      return res.status(400).json({ valid: false, error: 'Correo o referencia de pago inválidos.' })
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.status !== 'complete' || session.payment_status !== 'paid') return res.status(403).json({ valid: false, error: 'El pago todavía no está confirmado.' })
    const stripeEmail = cleanEmail(session.customer_details?.email || session.customer_email)
    if (stripeEmail !== email || !['payment', 'subscription'].includes(session.mode)) return res.status(403).json({ valid: false, error: 'El correo o el tipo de pago no coinciden.' })
    const snap = await findPayment(db(), email, sessionId)
    if (!snap.exists) return res.status(409).json({ valid: false, error: 'Estamos confirmando tu pago. Intenta nuevamente en unos segundos.' })
    const payment = snap.data()
    if (payment.stripeSessionId !== sessionId) return res.status(403).json({ valid: false, error: 'Esta referencia no corresponde al pago registrado.' })
    if (payment.paymentUsed === true || payment.registrationCompleted === true) return res.status(403).json({ valid: false, error: 'Esta compra ya se utilizó. Si ya tienes cuenta, inicia sesión.' })
    if (!['paid', 'completed'].includes(payment.paymentStatus) || payment.accessStatus !== 'active') return res.status(403).json({ valid: false, error: 'Este pago no está activo para inscripción.' })
    if (session.mode === 'subscription') {
      const subscriptionId = idOf(session.subscription)
      if (!subscriptionId || (payment.stripeSubscriptionId && payment.stripeSubscriptionId !== subscriptionId)) return res.status(403).json({ valid: false, error: 'La suscripción no coincide.' })
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      if (!['active', 'trialing'].includes(subscription.status)) return res.status(403).json({ valid: false, error: 'La suscripción no está activa.' })
    }
    return res.status(200).json({ valid: true, email, sessionId, mode: session.mode,
      currency: String(session.currency || '').toUpperCase(), amountTotal: session.amount_total,
      message: 'Pago verificado correctamente.' })
  } catch (error) {
    console.error('Error verificando pago:', error)
    return res.status(500).json({ valid: false, error: 'No pudimos verificar el pago. Inténtalo nuevamente.' })
  }
}
