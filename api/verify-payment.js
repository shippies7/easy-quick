import admin from "firebase-admin"

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

function cleanEmail(email) {
  return String(email || "").trim().toLowerCase()
}

function emailToDocId(email) {
  return encodeURIComponent(cleanEmail(email))
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const email = cleanEmail(
      req.method === "GET" ? req.query.email : req.body.email
    )

    if (!email) {
      return res.status(400).json({ valid: false, error: "Correo requerido" })
    }

    initFirebaseAdmin()
    const db = admin.firestore()

    const paymentRef = db.collection("pendingPayments").doc(emailToDocId(email))
    const paymentSnap = await paymentRef.get()

    if (!paymentSnap.exists) {
      return res.status(403).json({
        valid: false,
        error: "No encontramos un pago válido asociado a este correo."
      })
    }

    const payment = paymentSnap.data()

    if (
      payment.paymentStatus !== "paid" ||
      payment.accessStatus !== "active" ||
      payment.paymentUsed === true
    ) {
      return res.status(403).json({
        valid: false,
        error: "Este pago ya fue utilizado para crear una cuenta. Si ya te registraste, inicia sesión con ese correo."
      })
    }

    return res.status(200).json({
      valid: true,
      payment
    })
  } catch (error) {
    console.error("Error verificando pago:", error)
    return res.status(500).json({
      valid: false,
      error: "No se pudo verificar el pago."
    })
  }
}