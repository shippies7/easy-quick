const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Backend de Zoom funcionando")
})

app.post("/signature", (req, res) => {
  try {
    const { meetingNumber, role } = req.body

    const sdkKey = process.env.ZOOM_SDK_KEY
    const sdkSecret = process.env.ZOOM_SDK_SECRET

    if (!sdkKey || !sdkSecret) {
      return res.status(500).json({
        error: "Faltan ZOOM_SDK_KEY o ZOOM_SDK_SECRET en backend/.env"
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
      algorithm: "HS256",
      header: {
        typ: "JWT"
      }
    })

    res.json({ signature })
  } catch (error) {
    console.error("Error generando signature:", error)
    res.status(500).json({ error: "No se pudo generar la signature" })
  }
})

app.listen(4000, () => {
  console.log("Servidor corriendo en http://localhost:4000")
})