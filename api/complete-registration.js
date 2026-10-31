
import Stripe from "stripe"
import admin from "firebase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function initFirebaseAdmin() {
  if (admin.apps.length) return admin.app()

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  })
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase()
}

function emailToDocId(email) {
  return encodeURIComponent(cleanEmail(email))
}

function getStripeId(value) {
  return typeof value === "string" ? value : value?.id || null
}

const GROUP_OPTIONS = {
  "martes-jueves-8pm": {
    name: "Martes y jueves",
    schedule: "8:00 pm a 9:30 pm",
    level: "Principiantes",
    status: "pending_admin_assignment"
  },
  "lmv-8pm": {
    name: "Lunes, miércoles y viernes",
    schedule: "8:00 pm a 9:00 pm",
    level: "Avanzado B1 en adelante",
    status: "pending_admin_assignment"
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Método no permitido."
    })
  }

  try {
    initFirebaseAdmin()

    const authorization = String(
      req.headers.authorization || ""
    )

    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : ""

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Debes iniciar sesión para completar el registro."
      })
    }

    // Verificar la identidad real del alumno con Firebase.
    let decodedToken

    try {
      decodedToken = await admin.auth().verifyIdToken(
        token,
        true
      )
    } catch {
      return res.status(401).json({
        success: false,
        error: "Tu sesión no es válida. Vuelve a iniciar sesión."
      })
    }

    const {
      uid,
      name,
      email,
      sessionId,
      session_id,
      groupPreferenceId,
      diagnosticResult,
      diagnosticSubmitted
    } = req.body || {}

    const cleanName = String(name || "").trim()
    const cleanEmailValue = cleanEmail(email)
    const stripeSessionId = String(
      sessionId || session_id || ""
    ).trim()

    const selectedGroup = GROUP_OPTIONS[groupPreferenceId]

    if (
      !cleanName ||
      !cleanEmailValue ||
      !stripeSessionId ||
      !selectedGroup
    ) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos para completar el registro."
      })
    }

    if (
      decodedToken.uid !== uid ||
      cleanEmail(decodedToken.email) !== cleanEmailValue
    ) {
      return res.status(403).json({
        success: false,
        error: "Los datos no coinciden con la cuenta autenticada."
      })
    }

    if (!/^cs_(test_|live_)[a-zA-Z0-9]+$/.test(stripeSessionId)) {
      return res.status(400).json({
        success: false,
        error: "La referencia del pago no es válida."
      })
    }

    // Verificar nuevamente la compra directamente con Stripe.
    const session = await stripe.checkout.sessions.retrieve(
      stripeSessionId
    )

    const stripeEmail = cleanEmail(
      session.customer_details?.email ||
      session.customer_email
    )

    if (
      session.status !== "complete" ||
      session.payment_status !== "paid" ||
      stripeEmail !== cleanEmailValue
    ) {
      return res.status(403).json({
        success: false,
        error: "No se pudo confirmar el pago de esta cuenta."
      })
    }

    if (
      session.mode !== "payment" &&
      session.mode !== "subscription"
    ) {
      return res.status(403).json({
        success: false,
        error: "El tipo de pago no es válido."
      })
    }

    const subscriptionId = getStripeId(session.subscription)
    const customerId = getStripeId(session.customer)

    if (session.mode === "subscription") {
      if (!subscriptionId) {
        return res.status(403).json({
          success: false,
          error: "No se encontró la suscripción."
        })
      }

      const subscription = await stripe.subscriptions.retrieve(
        subscriptionId
      )

      if (
        !["active", "trialing"].includes(subscription.status)
      ) {
        return res.status(403).json({
          success: false,
          error: "La suscripción no se encuentra activa."
        })
      }
    }

    const db = admin.firestore()

    const paymentRef = db.collection("pendingPayments")
      .doc(emailToDocId(cleanEmailValue))

    const studentRef = db.collection("students")
      .doc(decodedToken.uid)

    await db.runTransaction(async transaction => {
      const paymentSnap = await transaction.get(paymentRef)
      const studentSnap = await transaction.get(studentRef)

      if (!paymentSnap.exists) {
        throw new Error(
          "Estamos confirmando tu pago. Espera unos segundos e inténtalo nuevamente."
        )
      }

      const payment = paymentSnap.data()

      if (
        payment.stripeSessionId !== stripeSessionId ||
        payment.paymentStatus !== "paid" ||
        payment.accessStatus !== "active"
      ) {
        throw new Error(
          "El pago no está disponible para completar este registro."
        )
      }

      if (
        payment.paymentUsed === true ||
        payment.registrationCompleted === true
      ) {
        throw new Error(
          "Este pago ya fue utilizado para crear una cuenta."
        )
      }

      if (
        studentSnap.exists &&
        studentSnap.data()?.email !== cleanEmailValue
      ) {
        throw new Error(
          "Esta cuenta ya está asociada a otro alumno."
        )
      }

      if (
        payment.stripeCustomerId &&
        payment.stripeCustomerId !== customerId
      ) {
        throw new Error(
          "El cliente de Stripe no coincide con el pago."
        )
      }

      if (
        payment.stripeSubscriptionId &&
        payment.stripeSubscriptionId !== subscriptionId
      ) {
        throw new Error(
          "La suscripción no coincide con el pago."
        )
      }

      const now = admin.firestore.FieldValue.serverTimestamp()

      transaction.set(studentRef, {
        name: cleanName,
        email: cleanEmailValue,
        role: "student",
        status: "active",

        paymentStatus: "paid",
        accessStatus: "active",
        source: "stripe_payment_link",

        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeSessionId,

        planName: payment.planName || null,
        mode: session.mode,
        amountTotal: session.amount_total,
        currency: session.currency || "mxn",

        limitedPayments: payment.limitedPayments || false,
        maximumPayments: payment.maximumPayments || null,
        paymentsMade: payment.paymentsMade || 0,

        groupPreferenceId,
        groupPreference: selectedGroup,
        assignedGroupId: null,
        assignedByAdmin: false,

        diagnosticResult: diagnosticSubmitted
          ? diagnosticResult || null
          : null,
        diagnosticSubmitted: Boolean(diagnosticSubmitted),

        createdAt: now,
        updatedAt: now
      })

      transaction.set(paymentRef, {
        paymentUsed: true,
        registrationCompleted: true,
        studentUid: decodedToken.uid,
        studentName: cleanName,
        updatedAt: now
      }, { merge: true })
    })

    return res.status(200).json({
      success: true,
      message: "Registro completado correctamente."
    })
  } catch (error) {
    console.error("Error completando registro:", error)

    return res.status(400).json({
      success: false,
      error:
        error.message ||
        "No se pudo completar el registro."
    })
  }
}
