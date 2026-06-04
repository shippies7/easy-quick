import Stripe from "stripe"
import admin from "firebase-admin"

export const config = {
  api: {
    bodyParser: false
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []

    req.on("data", (chunk) => {
      chunks.push(chunk)
    })

    req.on("end", () => {
      resolve(Buffer.concat(chunks))
    })

    req.on("error", reject)
  })
}

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

function getPaymentPlan(amountTotal, mode) {
  const amount = Number(amountTotal || 0) / 100

  if (mode === "subscription") return `Mensualidad ${amount} MXN`

  return `Pago único ${amount} MXN`
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido"
    })
  }

  try {
    const rawBody = await getRawBody(req)
    const signature = req.headers["stripe-signature"]

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    initFirebaseAdmin()
    const db = admin.firestore()

    if (event.type === "checkout.session.completed") {
      const session = event.data.object

      const email = cleanEmail(
        session.customer_details?.email ||
        session.customer_email ||
        session.metadata?.email
      )

      if (!email) {
        console.log("Pago recibido sin email:", session.id)
        return res.status(200).json({ received: true })
      }

      const paymentData = {
        email,
        stripeSessionId: session.id,
        stripeCustomerId: session.customer || null,
        stripeSubscriptionId: session.subscription || null,
        paymentStatus: "paid",
        accessStatus: "active",
        registrationCompleted: false,
        paymentUsed: false,
        mode: session.mode || null,
        amountTotal: session.amount_total || null,
        currency: session.currency || "mxn",
        planName: getPaymentPlan(session.amount_total, session.mode),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }

      await db
        .collection("pendingPayments")
        .doc(emailToDocId(email))
        .set(paymentData, { merge: true })

      console.log("Pago guardado en Firebase:", email)
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object
      const email = cleanEmail(invoice.customer_email)

      if (email) {
        await db
          .collection("pendingPayments")
          .doc(emailToDocId(email))
          .set(
            {
              email,
              stripeCustomerId: invoice.customer || null,
              stripeSubscriptionId: invoice.subscription || null,
              paymentStatus: "paid",
              accessStatus: "active",
              lastInvoiceId: invoice.id,
              lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
          )

        console.log("Mensualidad pagada:", email)
      }
    }

    if (
      event.type === "invoice.payment_failed" ||
      event.type === "customer.subscription.deleted"
    ) {
      const data = event.data.object
      const email = cleanEmail(data.customer_email)

      if (email) {
        await db
          .collection("pendingPayments")
          .doc(emailToDocId(email))
          .set(
            {
              email,
              paymentStatus: "failed",
              accessStatus: "suspended",
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
          )

        console.log("Acceso suspendido:", email)
      }
    }

    return res.status(200).json({
      received: true
    })
  } catch (error) {
    console.error("Error webhook:", error.message)

    return res.status(400).send(`Webhook Error: ${error.message}`)
  }
}