<template>
  <main class="register-page">
    <section class="register-card">
      <p class="eyebrow">Quick & Easy</p>
      <h1>Completa tu registro</h1>

      <p class="subtitle">
        Crea tu cuenta con el mismo correo de tu compra y selecciona tu horario de preferencia.
      </p>

      <form v-if="!awaitingVerification" class="register-form" @submit.prevent="handleRegister">
        <label>
          Nombre completo
          <input v-model="form.name" type="text" placeholder="Escribe tu nombre completo" required />
        </label>

        <label>
          Correo electrónico
          <input v-model="form.email" type="email" placeholder="tu.correo@email.com" required />
        </label>

        <label>
          Contraseña
          <input v-model="form.password" type="password" placeholder="Crea una contraseña" required minlength="6" />
        </label>

        <div class="group-section">
          <p class="group-title">Selecciona tu horario de preferencia</p>

          <label class="group-option">
            <input v-model="form.groupPreference" type="radio" value="martes-jueves-8pm" required />
            <span>
              <strong>Martes y jueves</strong>
              <small>8:00 pm a 9:30 pm · Principiantes</small>
            </span>
          </label>

          <label class="group-option">
            <input v-model="form.groupPreference" type="radio" value="lmv-8pm" required />
            <span>
              <strong>Lunes, miércoles y viernes</strong>
              <small>8:00 pm a 9:00 pm · Avanzado (B1 en adelante)</small>
            </span>
          </label>
        </div>

        <div class="diagnostic-section subtle-diagnostic">
          <div class="diagnostic-wrapper">
            <label class="diagnostic-check">
              <input v-model="form.wantsToAddDiagnostic" type="checkbox" />
              <span>Quiero ingresar el resultado de mi diagnóstico</span>
            </label>

            <p v-if="!form.wantsToAddDiagnostic" class="diagnostic-help">
              Si no sabes tu nivel, no pasa nada.
              <b>Si eres principiante no es necesario realizar el diagnóstico para completar tu registro.</b>
              <RouterLink to="/diagnostico">
                (Si aun así quieres hacerlo, haz clic aquí.)
              </RouterLink>
            </p>
          </div>

          <label v-if="form.wantsToAddDiagnostic" class="diagnostic-select">
            Resultado del diagnóstico
            <select v-model="form.diagnosticResult" required>
              <option value="" disabled>Selecciona tu resultado</option>
              <option value="A1 — Interchange Intro">A1 — Interchange Intro</option>
              <option value="A2 — Interchange Book 1">A2 — Interchange Book 1</option>
              <option value="B1 — Interchange Book 2">B1 — Interchange Book 2</option>
              <option value="B2 — Interchange Book 3">B2 — Interchange Book 3</option>
              <option value="C1 — Interchange Book 3 Avanzado">C1 — Interchange Book 3 Avanzado</option>
            </select>
          </label>
        </div>

        <button type="submit" :disabled="loading || !sessionId">
          {{ loading ? 'Procesando...' : 'Crear mi cuenta' }}
        </button>

        <p v-if="message" :class="['message', messageType]">
          {{ message }}
        </p>
      </form>

      <div v-if="awaitingVerification" class="verification-box">
        <h2>Verifica tu correo electrónico</h2>
        <p>Te enviamos un enlace de verificación a <strong>{{ registeredEmail }}</strong>. Ábrelo y después regresa aquí.</p>
        <button type="button" :disabled="loading" @click="finishRegistration">
          {{ loading ? 'Comprobando...' : 'Ya verifiqué mi correo — continuar' }}
        </button>
        <button type="button" class="secondary-button" :disabled="loading" @click="resendVerification">Reenviar correo de verificación</button>
        <p v-if="message" :class="['message', messageType]">{{ message }}</p>
      </div>

      <p class="small-note">
        La asignación final del grupo será confirmada por administración.
      </p>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  reload
} from 'firebase/auth'
import { auth } from '../firebase'

const router = useRouter()
const route = useRoute()
const sessionId = String(route.query.session_id || '').trim()
const loading = ref(false)
const message = ref('')
const messageType = ref('')
const awaitingVerification = ref(false)
const registeredEmail = ref('')

const form = ref({
  name: '', email: '', password: '', groupPreference: '',
  wantsToAddDiagnostic: false, diagnosticResult: ''
})

const groupOptions = {
  'martes-jueves-8pm': {
    name: 'Martes y jueves', schedule: '8:00 pm a 9:30 pm',
    level: 'Principiantes', status: 'pending_admin_assignment'
  },
  'lmv-8pm': {
    name: 'Lunes, miércoles y viernes', schedule: '8:00 pm a 9:00 pm',
    level: 'Avanzado B1 en adelante', status: 'pending_admin_assignment'
  }
}

async function postJson(url, body, token = null) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Ocurrió un error.')
  return data
}

function showError(error) {
  console.error(error)
  messageType.value = 'error'
  if (error.code === 'auth/weak-password') {
    message.value = 'La contraseña debe tener al menos 6 caracteres.'
  } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
    message.value = 'Ya existe una cuenta con este correo. Ingresa su contraseña correcta o recupera tu acceso desde Iniciar sesión.'
  } else {
    message.value = error.message || 'Ocurrió un error. Intenta nuevamente.'
  }
}

async function handleRegister() {
  if (loading.value) return
  loading.value = true
  message.value = ''
  try {
    const email = form.value.email.trim().toLowerCase()
    const name = form.value.name.trim()
    if (!groupOptions[form.value.groupPreference]) {
      throw new Error('Selecciona un horario de preferencia.')
    }
    if (form.value.wantsToAddDiagnostic && !form.value.diagnosticResult) {
      throw new Error('Selecciona el resultado de tu diagnóstico.')
    }

    if (!sessionId) throw new Error('No encontramos la referencia de tu pago. Regresa desde el enlace de confirmación de Stripe.')
    await postJson('/api/verify-payment', { email, sessionId })

    let user
    try {
      const result = await createUserWithEmailAndPassword(auth, email, form.value.password)
      user = result.user
      await updateProfile(user, { displayName: name })
    } catch (error) {
      if (error.code !== 'auth/email-already-in-use') throw error
      const result = await signInWithEmailAndPassword(auth, email, form.value.password)
      user = result.user
    }

    registeredEmail.value = email
    awaitingVerification.value = true
    if (!user.emailVerified) {
      await sendEmailVerification(user)
      message.value = 'Te enviamos un correo de verificación. Revisa también spam.'
      messageType.value = 'success'
    } else {
      loading.value = false
      await finishRegistration()
    }
  } catch (error) {
    showError(error)
  } finally {
    loading.value = false
  }
}

async function resendVerification() {
  if (loading.value) return
  loading.value = true
  message.value = ''
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Tu sesión terminó. Vuelve a iniciar sesión.')
    await reload(user)
    if (user.emailVerified) {
      message.value = 'Tu correo ya está verificado. Pulsa continuar.'
    } else {
      await sendEmailVerification(user)
      message.value = 'Enviamos un nuevo correo de verificación.'
    }
    messageType.value = 'success'
  } catch (error) {
    showError(error)
  } finally {
    loading.value = false
  }
}

async function finishRegistration() {
  if (loading.value) return
  loading.value = true
  message.value = ''
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Tu sesión terminó. Inicia sesión y vuelve a intentarlo.')
    await reload(user)
    if (!user.emailVerified) {
      throw new Error('Tu correo todavía no está verificado. Abre el enlace que te enviamos.')
    }
    const email = form.value.email.trim().toLowerCase()
    if (user.email?.toLowerCase() !== email) {
      throw new Error('El correo de tu cuenta no coincide con el del registro.')
    }
    const token = await user.getIdToken(true)
    await postJson('/api/complete-registration', {
      uid: user.uid,
      name: form.value.name.trim(),
      email,
      sessionId,
      groupPreferenceId: form.value.groupPreference,
      groupPreference: groupOptions[form.value.groupPreference],
      diagnosticResult: form.value.wantsToAddDiagnostic ? form.value.diagnosticResult : null,
      diagnosticSubmitted: form.value.wantsToAddDiagnostic
    }, token)
    message.value = 'Registro completado. Entrando a tu plataforma...'
    messageType.value = 'success'
    await router.push('/clase')
  } catch (error) {
    showError(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!sessionId) {
    message.value = 'No encontramos la referencia de pago. Accede desde el enlace de confirmación de Stripe.'
    messageType.value = 'error'
  }
})
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  padding: 80px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, rgba(211, 32, 65, 0.12), transparent 35%),
    radial-gradient(circle at top right, rgba(21, 45, 91, 0.16), transparent 35%),
    #ffffff;
  color: #152d5b;
  font-family: Arial, sans-serif;
}

.register-card {
  width: 100%;
  max-width: 620px;
  background: #ffffff;
  border: 1px solid rgba(21, 45, 91, 0.1);
  border-radius: 30px;
  padding: 42px;
  box-shadow: 0 18px 45px rgba(21, 45, 91, 0.12);
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 0.9rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #d32041;
  font-weight: 800;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.2rem);
  line-height: 1.05;
  color: #152d5b;
}

.subtitle {
  margin: 18px 0 28px;
  color: #40506b;
  line-height: 1.6;
}

.register-form {
  display: grid;
  gap: 18px;
}

.register-form label {
  display: grid;
  gap: 8px;
  color: #152d5b;
  font-weight: 800;
}

.register-form input,
.register-form select {
  width: 100%;
  border: 1px solid rgba(21, 45, 91, 0.18);
  border-radius: 999px;
  padding: 15px 18px;
  font-size: 1rem;
  color: #152d5b;
  outline: none;
  background: #ffffff;
}

.register-form input:focus,
.register-form select:focus {
  border-color: #d32041;
  box-shadow: 0 0 0 4px rgba(211, 32, 65, 0.1);
}

.group-section,
.diagnostic-section {
  display: grid;
  gap: 12px;
}

.group-title {
  margin: 0;
  font-weight: 900;
  color: #152d5b;
}

.group-option {
  display: flex !important;
  grid-template-columns: none !important;
  align-items: flex-start;
  gap: 12px !important;
  padding: 16px;
  border: 1px solid rgba(21, 45, 91, 0.14);
  border-radius: 18px;
  background: #f7f9ff;
  cursor: pointer;
}

.group-option input {
  width: auto;
  margin-top: 4px;
  accent-color: #d32041;
}

.group-option span {
  display: grid;
  gap: 4px;
}

.group-option small {
  color: #40506b;
  font-weight: 500;
}

.subtle-diagnostic {
  margin-top: 4px;
  padding-top: 4px;
}

.diagnostic-wrapper {
  display: grid;
  gap: 6px;
}

.diagnostic-check {
  display: flex !important;
  align-items: flex-start;
  gap: 10px !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  cursor: pointer;
}

.diagnostic-check input {
  width: auto;
  margin-top: 4px;
  accent-color: #d32041;
}

.diagnostic-check span {
  font-size: 0.9rem;
  font-weight: 600;
  color: #40506b;
}

.diagnostic-help {
  margin: 0 0 0 28px;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #6b7280;
}

.diagnostic-help a {
  color: #6b7280;
  text-decoration: underline;
}

.diagnostic-help a:hover {
  color: #152d5b;
}

.diagnostic-select {
  display: grid;
  gap: 8px;
}

.register-form button {
  margin-top: 8px;
  border: none;
  border-radius: 999px;
  padding: 15px 24px;
  background: #152d5b;
  color: #ffffff;
  font-weight: 800;
  cursor: pointer;
  font-size: 1rem;
}

.register-form button:hover {
  background: #d32041;
}

.register-form button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.message {
  margin: 0;
  padding: 14px 16px;
  border-radius: 16px;
  line-height: 1.5;
}

.message.success {
  background: rgba(22, 163, 74, 0.12);
  color: #166534;
}

.message.error {
  background: rgba(211, 32, 65, 0.1);
  color: #b91c1c;
}

.small-note {
  margin: 22px 0 0;
  color: #40506b;
  font-size: 0.92rem;
  line-height: 1.5;
}

@media (max-width: 700px) {
  .register-page {
    padding: 56px 18px;
  }

  .register-card {
    padding: 30px 22px;
  }
}
 .verification-box { display: grid; gap: 14px; margin-top: 18px; }
.verification-box button { border: 0; border-radius: 999px; padding: 14px; background: #152d5b; color: white; font-weight: 800; cursor: pointer; }
.verification-box .secondary-button { background: #f2f4f9; color: #152d5b; }
.verification-box button:disabled { opacity: .6; }
</style>
