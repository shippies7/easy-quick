<template>
  <div class="app">
    <h1>Zoom prueba</h1>

    <button @click="entrarReunion" :disabled="cargando">
      {{ cargando ? 'Cargando Zoom...' : 'Entrar reunión dentro de mi página' }}
    </button>

    <p v-if="mensaje">{{ mensaje }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ZoomMtg } from '@zoom/meetingsdk'

const cargando = ref(false)
const mensaje = ref('')

const sdkKey = import.meta.env.VITE_ZOOM_SDK_KEY
const meetingNumber = '82275218133'
const passWord = '868344'
const userName = 'Invitado'
const leaveUrl = 'http://localhost:5173'

async function entrarReunion() {
  try {
    cargando.value = true
    mensaje.value = 'Obteniendo firma de Zoom...'

    ZoomMtg.preLoadWasm()
    ZoomMtg.prepareWebSDK()

    const response = await fetch('/api/signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meetingNumber,
        role: 0
      })
    })

    const data = await response.json()

    if (!data.signature) {
      console.error('Respuesta backend:', data)
      mensaje.value = 'No se pudo obtener la firma.'
      cargando.value = false
      return
    }

    mensaje.value = 'Iniciando Zoom...'

    ZoomMtg.init({
      leaveUrl,
      patchJsMedia: true,
      success: function () {
        mensaje.value = 'Entrando a la reunión...'

        ZoomMtg.join({
          signature: data.signature,
          sdkKey,
          meetingNumber,
          passWord,
          userName,
          success: function (res) {
            console.log('Entró a la reunión:', res)
            mensaje.value = ''
            cargando.value = false
          },
          error: function (err) {
            console.error('Error en join:', err)
            mensaje.value = 'Error al entrar a la reunión. Revisa la consola.'
            cargando.value = false
          }
        })
      },
      error: function (err) {
        console.error('Error en init:', err)
        mensaje.value = 'Error al iniciar Zoom. Revisa la consola.'
        cargando.value = false
      }
    })
  } catch (error) {
    console.error('Error general:', error)
    mensaje.value = 'No se pudo conectar con el backend.'
    cargando.value = false
  }
}
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: white;
  color: black;
  font-family: Arial, sans-serif;
}

.app {
  padding: 20px;
}
</style>