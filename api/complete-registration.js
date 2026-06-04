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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const {
      uid,
      name,
      email,
      groupPreferenceId,
      groupPreference,
      diagnosticResult,
      diagnosticSubmitted
    } = req.body

    const cleanName = String(name || "").trim()
    const cleanEmailValue = cleanEmail(email)

    if (!uid || !cleanName || !cleanEmailValue || !groupPreferenceId || !groupPreference) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos para completar el registro."
      })
    }

    initFirebaseAdmin()
    const db = admin.firestore()

    const paymentRef = db.collection("pendingPayments").doc(emailToDocId(cleanEmailValue))
    const studentRef = db.collection("students").doc(uid)

    await db.runTransaction(async (transaction) => {
      const paymentSnap = await transaction.get(paymentRef)

      if (!paymentSnap.exists) {
        throw new Error("No encontramos un pago válido asociado a este correo.")
      }

      const payment = paymentSnap.data()

      if (
        payment.paymentStatus !== "paid" ||
        payment.accessStatus !== "active" ||
        payment.paymentUsed === true
      ) {
        throw new Error("Este pago no está disponible para crear una cuenta.")
      }

      transaction.set(studentRef, {
        name: cleanName,
        email: cleanEmailValue,
        role: "student",
        status: "active",
        paymentStatus: "paid",
        accessStatus: "active",
        source: "stripe_payment_link",
        stripeCustomerId: payment.stripeCustomerId || null,
        stripeSubscriptionId: payment.stripeSubscriptionId || null,
        stripeSessionId: payment.stripeSessionId || null,
        planName: payment.planName || null,
        mode: payment.mode || null,
        amountTotal: payment.amountTotal || null,
        currency: payment.currency || "mxn",
        groupPreferenceId,
        groupPreference,
        assignedGroupId: null,
        assignedByAdmin: false,
        diagnosticResult: diagnosticSubmitted ? diagnosticResult : null,
        diagnosticSubmitted: Boolean(diagnosticSubmitted),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

      transaction.set(
        paymentRef,
        {
          paymentUsed: true,
          registrationCompleted: true,
          studentUid: uid,
          studentName: cleanName,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      )
    })

    return res.status(200).json({
      success: true
    })
  } catch (error) {
    console.error("Error completando registro:", error)
    return res.status(400).json({
      success: false,
      error: error.message || "No se pudo completar el registro."
    })
  }
}