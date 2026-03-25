<template>
  <div class="page">
    <div class="topbar">
      <h1>Tu espacio</h1>
      <button class="logout-btn" @click="cerrarSesion" :disabled="cerrandoSesion">
        {{ cerrandoSesion ? 'Saliendo...' : 'Cerrar sesión' }}
      </button>
    </div>

    <div class="content">
      <div class="layout">
        <div class="info-card">
          <div class="badge">Acceso activo</div>

          <h2 v-if="studentData.name">{{ studentData.name }}</h2>
          <h2 v-else>Cargando tu información...</h2>

          <p class="subtitle">
            Este es tu espacio dentro de Easy & Quick School.
          </p>

          <div class="data-grid">
            <div class="data-box">
              <span class="label">Código</span>
              <span class="value">{{ studentData.studentCode || 'Pendiente' }}</span>
            </div>

            <div class="data-box">
              <span class="label">Grupo</span>
              <span class="value">{{ studentData.groupCode || 'Pendiente' }}</span>
            </div>
          </div>

          <div class="notice">
            <p>
              Estamos afinando nuevos detalles de tu experiencia dentro de la plataforma.
              Muy pronto verás más información útil aquí, además de tus accesos y avisos.
            </p>
          </div>
        </div>

        <div class="class-card">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ZoomMtg } from '@zoom/meetingsdk'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

const cargando = ref(false)
const mensaje = ref('')
const cerrandoSesion = ref(false)
const router = useRouter()

const studentData = reactive({
  name: '',
  studentCode: '',
  groupCode: ''
})

const sdkKey = import.meta.env.VITE_ZOOM_SDK_KEY
const meetingNumber = '82275218133'
const passWord = '868344'
const leaveUrl = 'http://localhost:5173'
const userName = ref('Invitado')

const normalizeEmail = (value) =>
  String(value || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase()

async function loadStudentDataByEmail(email) {
  try {
    const studentsRef = collection(db, 'students')
    const snapshot = await getDocs(studentsRef)

    const normalizedEmail = normalizeEmail(email)

    const studentDoc = snapshot.docs.find((docItem) => {
      const data = docItem.data()
      const firestoreEmail = normalizeEmail(data.email)
      return firestoreEmail === normalizedEmail
    })

    if (studentDoc) {
      const data = studentDoc.data()

      studentData.name = data.name || ''
      studentData.studentCode = data.studentCode || ''
      studentData.groupCode = data.groupCode || ''
      userName.value = data.name || 'Invitado'
    } else {
      console.log('No se encontró alumno con ese correo en Firestore:', email)
    }
  } catch (error) {
    console.error('Error al cargar datos del alumno:', error)
  }
}

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
          userName: userName.value,
          success: function () {
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

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user?.email) {
      await loadStudentDataByEmail(user.email)
    }
  })
})
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: #f6f4f1;
  color: #1f2937;
  font-family: Arial, sans-serif;
}

.page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(219, 39, 119, 0.08), transparent 28%),
    radial-gradient(circle at bottom right, rgba(30, 58, 138, 0.08), transparent 28%),
    #f6f4f1;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 30px;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid #ece7df;
  backdrop-filter: blur(10px);
}

.topbar h1 {
  margin: 0;
  font-size: 24px;
  color: #111827;
}

.logout-btn {
  background: #111827;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

.logout-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.content {
  padding: 40px 24px;
  box-sizing: border-box;
}

.layout {
  max-width: 1150px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
}

.info-card,
.class-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #ece7df;
  border-radius: 24px;
  padding: 34px 30px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(8px);
}

.badge {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 999px;
  background: #f3f0ea;
  color: #7c2d12;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 18px;
}

.info-card h2,
.class-card h2 {
  margin: 0 0 10px;
  font-size: 34px;
  color: #0f172a;
}

.subtitle {
  margin: 0 0 26px;
  color: #6b7280;
  font-size: 16px;
  line-height: 1.5;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.data-box {
  background: #fbfaf8;
  border: 1px solid #ece7df;
  border-radius: 18px;
  padding: 18px;
}

.label {
  display: block;
  font-size: 13px;
  color: #8a8f98;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.notice {
  background: linear-gradient(135deg, rgba(219, 39, 119, 0.06), rgba(30, 58, 138, 0.06));
  border: 1px solid rgba(203, 213, 225, 0.8);
  border-radius: 18px;
  padding: 18px 20px;
}

.notice p {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
  font-size: 15px;
}

.text {
  margin: 0 0 28px;
  color: #555;
  font-size: 17px;
  line-height: 1.6;
}

.zoom-btn {
  background: linear-gradient(90deg, #dc2626, #1e3a8a);
  color: white;
  border: none;
  padding: 15px 22px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  min-width: 220px;
  box-shadow: 0 12px 28px rgba(30, 58, 138, 0.18);
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

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .info-card h2,
  .class-card h2 {
    font-size: 28px;
  }

  .data-grid {
    grid-template-columns: 1fr;
  }
}
</style>