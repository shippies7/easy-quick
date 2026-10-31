
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      valid: false,
      error: "Método no permitido."
    })
  }

  try {
    const email = cleanEmail(req.body?.email)

    const sessionId = String(
      req.body?.sessionId || req.body?.session_id || ""
    ).trim()

    if (!email || !sessionId) {
      return res.status(400).json({
        valid: false,
        error: "Se requiere el correo y la referencia del pago."
      })
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^cs_(test_|live_)[a-zA-Z0-9]+$/.test(sessionId)
    ) {
      return res.status(400).json({
        valid: false,
        error: "Los datos del pago no son válidos."
      })
    }

    // Consultar el pago directamente con Stripe.
    let session

    try {
      session = await stripe.checkout.sessions.retrieve(sessionId)
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(403).json({
          valid: false,
          error: "No encontramos esta referencia de pago."
        })
      }

      throw error
    }

    if (
      session.status !== "complete" ||
      session.payment_status !== "paid"
    ) {
      return res.status(403).json({
        valid: false,
        error: "El pago todavía no está confirmado."
      })
    }

    const stripeEmail = cleanEmail(
      session.customer_details?.email ||
      session.customer_email
    )

    if (!stripeEmail || stripeEmail !== email) {
      return res.status(403).json({
        valid: false,
        error: "El correo no coincide con el utilizado en el pago."
      })
    }

    if (
      session.mode !== "payment" &&
      session.mode !== "subscription"
    ) {
      return res.status(403).json({
        valid: false,
        error: "Este tipo de pago no permite el registro."
      })
    }

    // Confirmar que la referencia corresponde a un
    // pago registrado en nuestra base de datos.
    initFirebaseAdmin()

    const db = admin.firestore()

    const paymentRef = db.collection("pendingPayments")
      .doc(emailToDocId(email))

    const paymentSnap = await paymentRef.get()

    if (!paymentSnap.exists) {
      return res.status(409).json({
        valid: false,
        error:
          "Estamos confirmando tu pago. Espera unos segundos e inténtalo nuevamente."
      })
    }

    const payment = paymentSnap.data()

    if (payment.stripeSessionId !== sessionId) {
      return res.status(403).json({
        valid: false,
        error:
          "Esta referencia no corresponde al pago registrado."
      })
    }

    if (
      payment.paymentUsed === true ||
      payment.registrationCompleted === true
    ) {
      return res.status(403).json({
        valid: false,
        error:
          "Este pago ya fue utilizado para crear una cuenta. Si ya te registraste, inicia sesión."
      })
    }

    if (
      payment.paymentStatus !== "paid" ||
      payment.accessStatus !== "active"
    ) {
      return res.status(403).json({
        valid: false,
        error:
          "Este pago no se encuentra activo para completar el registro."
      })
    }

    // En suscripciones, comprobar también su estado.
    if (session.mode === "subscription") {
      if (!session.subscription) {
        return res.status(403).json({
          valid: false,
          error: "No encontramos la suscripción asociada."
        })
      }

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id

      const subscription = await stripe.subscriptions.retrieve(
        subscriptionId
      )

      if (
        !["active", "trialing"].includes(subscription.status)
      ) {
        return res.status(403).json({
          valid: false,
          error:
            "La suscripción no está activa para completar el registro."
        })
      }

      if (
        payment.stripeSubscriptionId &&
        payment.stripeSubscriptionId !== subscriptionId
      ) {
        return res.status(403).json({
          valid: false,
          error: "La suscripción no coincide con el pago."
        })
      }
    }

    return res.status(200).json({
      valid: true,
      email,
      sessionId,
      mode: session.mode,
      currency: String(session.currency || "").toUpperCase(),
      amountTotal: session.amount_total,
      message: "Pago verificado correctamente."
    })
  } catch (error) {
    console.error("Error verificando pago:", error)

    return res.status(500).json({
      valid: false,
      error:
        "No pudimos verificar el pago en este momento. Inténtalo nuevamente."
    })
  }
}
