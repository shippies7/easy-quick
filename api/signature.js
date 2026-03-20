import jwt from "jsonwebtoken"

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" })
    }

    const { meetingNumber, role } = req.body

    const sdkKey = process.env.ZOOM_SDK_KEY
    const sdkSecret = process.env.ZOOM_SDK_SECRET

    if (!sdkKey || !sdkSecret) {
      return res.status(500).json({
        error: "Faltan variables de entorno"
      })
    }

    const iat = Math.floor(Date.now() / 1000) - 30
    const exp = iat + 60 * 60 * 2

    const payload = {
      sdkKey: sdkKey,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      appKey: sdkKey,
      tokenExp: exp
    }

    const signature = jwt.sign(payload, sdkSecret, {
      algorithm: "HS256"
    })

    return res.status(200).json({ signature })

  } catch (error) {
    console.error("Error generando signature:", error)
    return res.status(500).json({
      error: "No se pudo generar la signature"
    })
  }
}