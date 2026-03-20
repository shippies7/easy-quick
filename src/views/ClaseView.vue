<template>
  <div class="page">
    <div class="topbar">
      <h1>Tu clase</h1>
      <button class="logout-btn" @click="cerrarSesion" :disabled="cerrandoSesion">
        {{ cerrandoSesion ? 'Saliendo...' : 'Cerrar sesión' }}
      </button>
    </div>

    <div class="content">
      <div class="card">
        <h2>Entrar a tu clase en vivo</h2>
        <p class="text">
          Cuando sea tu horario, entra aquí para acceder a tu sesión.
        </p>

        <button @click="entrarReunion" :disabled="cargando" class="zoom-btn">
          {{ cargando ? 'Cargando Zoom...' : 'Entrar a clase' }}
        </button>

        <p v-if="mensaje" class="mensaje">{{ mensaje }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ZoomMtg } from '@zoom/meetingsdk'
import { signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { auth } from '../firebase'

const cargando = ref(false)
const mensaje = ref('')
const cerrandoSesion = ref(false)
const router = useRouter()

const sdkKey = import.meta.env.VITE_ZOOM_SDK_KEY
const meetingNumber = '82275218133'
const passWord = '868344'
const userName = 'Invitado'
const leaveUrl = 'http://localhost:5173'

async function entrarReunion() {
  try {
    cargando.value = true
    mensaje.value = 'Obteniendo acceso a tu clase...'

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
      mensaje.value = 'No se pudo obtener el acceso a la clase.'
      cargando.value = false
      return
    }

    mensaje.value = 'Iniciando clase...'

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
            mensaje.value = 'Error al entrar a la clase. Revisa la consola.'
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

async function cerrarSesion() {
  try {
    cerrandoSesion.value = true
    await signOut(auth)
    router.push('/login')
  } catch (error) {
    console.error(error)
    alert('No se pudo cerrar sesión.')
  } finally {
    cerrandoSesion.value = false
  }
}
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: #f7f7f7;
  color: black;
  font-family: Arial, sans-serif;
}

.page {
  min-height: 100vh;
  background: #f7f7f7;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.topbar h1 {
  margin: 0;
  font-size: 24px;
}

.logout-btn {
  background: black;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.logout-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.content {
  min-height: calc(100vh - 85px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.card {
  width: 100%;
  max-width: 520px;
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.card h2 {
  margin: 0 0 12px;
  font-size: 32px;
  color: #0f172a;
}

.text {
  margin: 0 0 28px;
  color: #555;
  font-size: 17px;
}

.zoom-btn {
  background: linear-gradient(90deg, #dc2626, #1e3a8a);
  color: white;
  border: none;
  padding: 15px 22px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  min-width: 220px;
}

.zoom-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.mensaje {
  margin-top: 18px;
  color: #444;
  font-size: 15px;
}
</style>