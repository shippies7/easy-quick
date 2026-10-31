import Stripe from 'stripe'
import admin from 'firebase-admin'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const cleanEmail = value => String(value || '').trim().toLowerCase()
const idOf = value => typeof value === 'string' ? value : value?.id || null
const GROUP_OPTIONS = {
  'lmv-8pm': { name: 'Lunes, miércoles y viernes', schedule: '8:00 pm a 9:00 pm', level: 'Curso completo', groupCode: 'LMV1012' },
  'sabados-9am': { name: 'Sábados', schedule: '9:00 am a 12:00 pm', level: 'Curso completo', groupCode: 'SAB1013' }
}
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
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método no permitido.' })
  try {
    const database = db()
    const header = String(req.headers.authorization || '')
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
    if (!token) return res.status(401).json({ success: false, error: 'Debes iniciar sesión.' })
    let decoded
    try { decoded = await admin.auth().verifyIdToken(token, true) }
    catch { return res.status(401).json({ success: false, error: 'Tu sesión no es válida.' }) }
    if (!decoded.email_verified) return res.status(403).json({ success: false, error: 'Verifica tu correo antes de terminar.' })
    const body = req.body || {}
    const sessionId = String(body.sessionId || body.session_id || '').trim()
    const email = cleanEmail(body.email)
    const name = String(body.name || '').trim().replace(/\s+/g, ' ')
    const groupPreferenceId = String(body.groupPreferenceId || '')
    const selectedGroup = GROUP_OPTIONS[groupPreferenceId]
    if (!/^cs_(test_|live_)[a-zA-Z0-9]+$/.test(sessionId) || !email || !name || !selectedGroup) return res.status(400).json({ success: false, error: 'Faltan datos válidos.' })
    if (name.length > 150 || cleanEmail(decoded.email) !== email) return res.status(403).json({ success: false, error: 'La cuenta no coincide con la compra.' })
    if (body.agreementAccepted !== true) return res.status(400).json({ success: false, error: 'Debes aceptar el acuerdo.' })
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const stripeEmail = cleanEmail(session.customer_details?.email || session.customer_email)
    if (session.status !== 'complete' || session.payment_status !== 'paid' || stripeEmail !== email) return res.status(403).json({ success: false, error: 'No pudimos confirmar el pago.' })
    if (!['payment', 'subscription'].includes(session.mode)) return res.status(403).json({ success: false, error: 'Tipo de pago no válido.' })
    const subscriptionId = idOf(session.subscription)
    const customerId = idOf(session.customer)
    if (session.mode === 'subscription') {
      if (!subscriptionId) return res.status(403).json({ success: false, error: 'No encontramos la suscripción.' })
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      if (!['active', 'trialing'].includes(subscription.status)) return res.status(403).json({ success: false, error: 'La suscripción no está activa.' })
    }
    const groupQuery = await database.collection('groups').where('groupCode', '==', selectedGroup.groupCode).limit(2).get()
    if (groupQuery.size !== 1) return res.status(409).json({ success: false, error: 'El grupo no está configurado correctamente.' })
    const groupRef = groupQuery.docs[0].ref
    const paymentRef = await paymentRefFor(database, email, sessionId)
    const studentRef = database.collection('students').doc(decoded.uid)
    const intakeRef = database.collection('registrationIntakes').doc(sessionId)
    let matricula
    await database.runTransaction(async tx => {
      const [paymentSnap, studentSnap, groupSnap, intakeSnap] = await Promise.all([
        tx.get(paymentRef), tx.get(studentRef), tx.get(groupRef), tx.get(intakeRef)
      ])
      if (!groupSnap.exists || groupSnap.data()?.status !== 'active') throw new Error('Este grupo no está disponible.')
      if (!paymentSnap.exists) throw new Error('Estamos confirmando tu pago. Inténtalo nuevamente.')
      const payment = paymentSnap.data()
      if (payment.stripeSessionId !== sessionId || !['paid', 'completed'].includes(payment.paymentStatus) || payment.accessStatus !== 'active') throw new Error('El pago no está disponible.')
      if (payment.paymentUsed || payment.registrationCompleted) throw new Error('Esta compra ya fue utilizada.')
      if (studentSnap.exists && cleanEmail(studentSnap.data()?.email) !== email) throw new Error('La cuenta está asociada a otro alumno.')
      if ((payment.stripeCustomerId && payment.stripeCustomerId !== customerId) ||
          (payment.stripeSubscriptionId && payment.stripeSubscriptionId !== subscriptionId)) throw new Error('Los datos de Stripe no coinciden.')
      matricula = String(payment.matricula || intakeSnap.data()?.matricula || '').trim()
      if (!matricula) throw new Error('Estamos preparando tu matrícula. Actualiza e inténtalo nuevamente.')
      if (body.matricula && String(body.matricula) !== matricula) throw new Error('La matrícula no coincide.')
      const now = admin.firestore.FieldValue.serverTimestamp()
      const previous = studentSnap.exists ? studentSnap.data() : {}
      const oldGroupId = previous.groupId || previous.assignedGroupId || null
      // Un usuario de Firebase equivale a un alumno: no incrementar de nuevo si ya está en el mismo grupo.
      if (oldGroupId && oldGroupId !== groupRef.id) throw new Error('Este alumno ya está inscrito en otro grupo. Solicita el cambio al administrador.')
      const alreadyCounted = oldGroupId === groupRef.id
      const studentMatricula = String(previous.matricula || matricula)
      tx.set(studentRef, {
        name, email, matricula: studentMatricula, role: 'student', status: 'active',
        paymentStatus: payment.paymentStatus, accessStatus: 'active', source: 'stripe_payment_link',
        stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId, stripeSessionId: sessionId,
        planName: payment.planName || null, mode: session.mode,
        amountTotal: session.amount_total, currency: session.currency || 'mxn',
        limitedPayments: payment.limitedPayments || false, maximumPayments: payment.maximumPayments || null,
        paymentsMade: payment.paymentsMade || 0, groupPreferenceId, groupPreference: selectedGroup,
        assignedGroupId: groupRef.id, groupId: groupRef.id, groupCode: selectedGroup.groupCode,
        assignedByAdmin: false, diagnosticResult: previous.diagnosticResult ?? null,
        diagnosticSubmitted: previous.diagnosticSubmitted ?? false,
        agreementAccepted: true, agreementVersion: '2026-10-31', agreementAcceptedAt: now,
        createdAt: previous.createdAt || now, updatedAt: now
      }, { merge: true })
      if (!alreadyCounted) tx.update(groupRef, { studentCount: admin.firestore.FieldValue.increment(1) })
      tx.set(paymentRef, { paymentUsed: true, registrationCompleted: true, studentUid: decoded.uid,
        studentName: name, matricula, agreementAccepted: true, agreementAcceptedAt: now,
        updatedAt: now }, { merge: true })
      tx.set(intakeRef, { status: 'completed', studentUid: decoded.uid, completedAt: now }, { merge: true })
    })
    return res.status(200).json({ success: true, matricula, message: 'Registro completado correctamente.' })
  } catch (error) {
    console.error('Error completando registro:', error)
    return res.status(400).json({ success: false, error: error.message || 'No se pudo completar el registro.' })
  }
}
