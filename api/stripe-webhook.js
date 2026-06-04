import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido"
    })
  }

  console.log("========== WEBHOOK RECIBIDO ==========")

  try {
    const signature = req.headers["stripe-signature"]

    const event = stripe.webhooks.constructEvent(
      JSON.stringify(req.body),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    console.log("Evento:", event.type)

    if (event.type === "checkout.session.completed") {
      const session = event.data.object

      console.log("¡¡PAGO EXITOSO!!")
      console.log(session)
    }

    return res.status(200).json({
      received: true
    })

  } catch (err) {
    console.error("Error webhook:", err.message)

    return res.status(400).send(
      `Webhook Error: ${err.message}`
    )
  }
}