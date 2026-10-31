import Stripe from 'stripe'
import admin from 'firebase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function initFirebaseAdmin() {
  if (admin.apps.length) return admin.app()
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  })
}

const cleanEmail = value => String(value || '').trim().toLowerCase()
const emailToDocId = email => encodeURIComponent(cleanEmail(email))
const getStripeId = value => typeof value === 'string' ? value : value?.id || null

const GROUP_OPTIONS = {
  'lmv-8pm': {
    name: 'Lunes, miércoles y viernes',
    schedule: '8:00 pm a 9:00 pm',
    level: 'Curso completo',
    groupCode: 'LMV1012'
  },
  'sabados-9am': {
    name: 'Sábados',
    schedule: '9:00 am a 12:00 pm',
    level: 'Curso completo',
    groupCode: 'SAB1013'
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método no permitido.' })
  try {
    initFirebaseAdmin()
    const authHeader = String(req.headers.authorization || '')
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
    if (!token) return res.status(401).json({ success: false, error: 'Debes iniciar sesión.' })

    let decoded
    try {
      decoded = await admin.auth().verifyIdToken(token, true)
    } catch {
      return res.status(401).json({ success: false, error: 'Tu sesión no es válida.' })
    }
    if (!decoded.email_verified) {
      return res.status(403).json({ success: false, error: 'Verifica tu correo antes de terminar la inscripción.' })
    }

    const body = req.body || {}
    const sessionId = String(body.sessionId || body.session_id || '').trim()
    const email = cleanEmail(body.email)
    const name = String(body.name || '').trim().replace(/\s+/g, ' ')
    const groupPreferenceId = String(body.groupPreferenceId || '')
    const selectedGroup = GROUP_OPTIONS[groupPreferenceId]

    if (!/^cs_(test_|live_)[a-zA-Z0-9]+$/.test(sessionId) || !email || !name || !selectedGroup) {
      return res.status(400).json({ success: false, error: 'Faltan datos válidos para completar el registro.' })
    }
    if (name.length > 150 || cleanEmail(decoded.email) !== email) {
      return res.status(403).json({ success: false, error: 'La cuenta no coincide con los datos de inscripción.' })
    }
    if (body.agreementAccepted !== true) {
      return res.status(400).json({ success: false, error: 'Debes aceptar el acuerdo de inscripción.' })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const stripeEmail = cleanEmail(session.customer_details?.email || session.customer_email)
    if (session.status !== 'complete' || session.payment_status !== 'paid' || stripeEmail !== email) {
      return res.status(403).json({ success: false, error: 'No pudimos confirmar este pago.' })
    }
    if (!['payment', 'subscription'].includes(session.mode)) {
      return res.status(403).json({ success: false, error: 'Tipo de pago no válido.' })
    }
    const subscriptionId = getStripeId(session.subscription)
    const customerId = getStripeId(session.customer)
    if (session.mode === 'subscription') {
      if (!subscriptionId) return res.status(403).json({ success: false, error: 'No encontramos la suscripción.' })
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      if (!['active', 'trialing'].includes(subscription.status)) {
        return res.status(403).json({ success: false, error: 'La suscripción no está activa.' })
      }
    }

    const db = admin.firestore()
    // Buscar el documento real del grupo por su código, no por un ID supuesto.
    const groupQuery = await db.collection('groups')
      .where('groupCode', '==', selectedGroup.groupCode).limit(2).get()
    if (groupQuery.size !== 1) {
      return res.status(409).json({ success: false, error: 'El grupo seleccionado no está configurado correctamente.' })
    }
    const groupRef = groupQuery.docs[0].ref

    const paymentRef = db.collection('pendingPayments').doc(emailToDocId(email))
    const studentRef = db.collection('students').doc(decoded.uid)
    let matricula
    await db.runTransaction(async transaction => {
      const paymentSnap = await transaction.get(paymentRef)
      const studentSnap = await transaction.get(studentRef)
      const groupSnap = await transaction.get(groupRef)
      if (!groupSnap.exists || groupSnap.data()?.status !== 'active') throw new Error('Este grupo no está disponible.')
      if (!paymentSnap.exists) throw new Error('Estamos confirmando tu pago. Inténtalo nuevamente en unos segundos.')
      const payment = paymentSnap.data()
      if (payment.stripeSessionId !== sessionId || payment.paymentStatus !== 'paid' || payment.accessStatus !== 'active') {
        throw new Error('El pago no está disponible para este registro.')
      }
      if (payment.paymentUsed === true || payment.registrationCompleted === true) {
        throw new Error('Este pago ya fue utilizado para crear una cuenta.')
      }
      if (studentSnap.exists && cleanEmail(studentSnap.data()?.email) !== email) {
        throw new Error('Esta cuenta está asociada a otro alumno.')
      }
      if (payment.stripeCustomerId && payment.stripeCustomerId !== customerId) {
        throw new Error('El cliente de Stripe no coincide con el pago.')
      }
      if (payment.stripeSubscriptionId && payment.stripeSubscriptionId !== subscriptionId) {
        throw new Error('La suscripción no coincide con el pago.')
      }
      // La matrícula debe haberse creado en registration-intake.js.
      // Se reutiliza para evitar duplicados o discrepancias.
      matricula = String(payment.matricula || payment.studentNumber || '').trim()
      if (!matricula) throw new Error('Todavía estamos preparando tu matrícula. Actualiza la página e inténtalo nuevamente.')
      if (body.matricula && String(body.matricula) !== matricula) {
        throw new Error('La matrícula no coincide con el registro del pago.')
      }
      const now = admin.firestore.FieldValue.serverTimestamp()
      transaction.set(studentRef, {
        name, email, matricula, role: 'student', status: 'active',
        paymentStatus: 'paid', accessStatus: 'active', source: 'stripe_payment_link',
        stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId, stripeSessionId: sessionId,
        planName: payment.planName || null, mode: session.mode,
        amountTotal: session.amount_total, currency: session.currency || 'mxn',
        limitedPayments: payment.limitedPayments || false,
        maximumPayments: payment.maximumPayments || null,
        paymentsMade: payment.paymentsMade || 0,
        groupPreferenceId, groupPreference: selectedGroup,
        assignedGroupId: groupRef.id, groupId: groupRef.id, groupCode: selectedGroup.groupCode, assignedByAdmin: false,
        diagnosticResult: null, diagnosticSubmitted: false,
        agreementAccepted: true,
        agreementVersion: '2026-10-31',
        agreementAcceptedAt: now,
        createdAt: studentSnap.exists ? (studentSnap.data()?.createdAt || now) : now,
        updatedAt: now
      }, { merge: true })
      transaction.update(groupRef, { studentCount: admin.firestore.FieldValue.increment(1) })
      transaction.set(paymentRef, {
        paymentUsed: true, registrationCompleted: true,
        studentUid: decoded.uid, studentName: name,
        matricula, agreementAccepted: true, agreementAcceptedAt: now,
        updatedAt: now
      }, { merge: true })
    })
    return res.status(200).json({ success: true, matricula, message: 'Registro completado correctamente.' })
  } catch (error) {
    console.error('Error completando registro:', error)
    return res.status(400).json({ success: false, error: error.message || 'No se pudo completar el registro.' })
  }
}
