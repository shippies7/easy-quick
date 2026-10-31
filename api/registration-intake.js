// Copiar TODO este archivo a: api/registration-intake.js
import Stripe from 'stripe'
import admin from 'firebase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function firestore() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    })
  }
  return admin.firestore()
}
const cleanEmail = value => String(value || '').trim().toLowerCase()
const getId = value => typeof value === 'string' ? value : value?.id || null

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' })
  try {
    const sessionId = String(req.body?.sessionId || req.body?.session_id || '').trim()
    if (!/^cs_(test_|live_)[a-zA-Z0-9]+$/.test(sessionId)) {
      return res.status(400).json({ error: 'Referencia de pago inválida.' })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      return res.status(403).json({ error: 'El pago aún no está confirmado.' })
    }
    if (!['payment', 'subscription'].includes(session.mode)) {
      return res.status(403).json({ error: 'Modalidad de pago no admitida.' })
    }
    const email = cleanEmail(session.customer_details?.email || session.customer_email)
    if (!email) return res.status(422).json({ error: 'Stripe no proporcionó un correo de compra.' })

    const db = firestore()
    const paymentRef = db.collection('pendingPayments').doc(encodeURIComponent(email))
    const paymentSnap = await paymentRef.get()
    if (!paymentSnap.exists) {
      return res.status(409).json({ error: 'Estamos confirmando tu pago. Intenta nuevamente en unos segundos.' })
    }
    const payment = paymentSnap.data()
    if (payment.stripeSessionId !== sessionId || payment.paymentStatus !== 'paid' || payment.accessStatus !== 'active') {
      return res.status(403).json({ error: 'Esta compra no está autorizada para inscripción.' })
    }
    if (payment.paymentUsed === true || payment.registrationCompleted === true) {
      return res.status(403).json({ error: 'Esta compra ya fue utilizada para crear una cuenta.' })
    }
    const customerId = getId(session.customer)
    const subscriptionId = getId(session.subscription)
    if (payment.stripeCustomerId && payment.stripeCustomerId !== customerId) {
      return res.status(403).json({ error: 'El cliente de Stripe no coincide.' })
    }
    if (payment.stripeSubscriptionId && payment.stripeSubscriptionId !== subscriptionId) {
      return res.status(403).json({ error: 'La suscripción no coincide.' })
    }
    if (session.mode === 'subscription') {
      if (!subscriptionId) return res.status(403).json({ error: 'No encontramos la suscripción.' })
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      if (!['active', 'trialing'].includes(subscription.status)) {
        return res.status(403).json({ error: 'La suscripción no está activa.' })
      }
    }

    const intakeRef = db.collection('registrationIntakes').doc(sessionId)
    const counterRef = db.collection('counters').doc('studentEnrollment')
    const record = await db.runTransaction(async tx => {
      const intakeSnap = await tx.get(intakeRef)
      if (intakeSnap.exists) {
        const existing = intakeSnap.data()
        if (!payment.matricula) tx.update(paymentRef, { matricula: existing.matricula, updatedAt: admin.firestore.FieldValue.serverTimestamp() })
        return existing
      }
      const counterSnap = await tx.get(counterRef)
      const next = Number(counterSnap.exists ? counterSnap.data().last || 0 : 0) + 1
      const year = new Date(session.created * 1000).getUTCFullYear()
      const matricula = `EQ-${year}-${String(next).padStart(5, '0')}`
      const data = {
        matricula,
        email,
        name: String(session.customer_details?.name || '').trim(),
        stripeSessionId: sessionId,
        currency: String(session.currency || '').toUpperCase(),
        amount: typeof session.amount_total === 'number' ? (session.amount_total / 100).toFixed(2) : null,
        status: 'pending_registration',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
      tx.set(counterRef, { last: next }, { merge: true })
      tx.create(intakeRef, data)
      tx.update(paymentRef, { matricula, updatedAt: admin.firestore.FieldValue.serverTimestamp() })
      return data
    })
    return res.status(200).json({
      matricula: record.matricula,
      email: record.email,
      name: record.name || '',
      currency: record.currency,
      amount: record.amount
    })
  } catch (error) {
    console.error('Error en registration-intake:', error)
    return res.status(500).json({ error: 'No pudimos preparar tu inscripción. Intenta nuevamente.' })
  }
}
