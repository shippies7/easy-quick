<template>
  <main class="register-page">
    <section class="register-card">
      <p class="eyebrow">Quick & Easy</p>
      <h1>Completa tu registro</h1>

      <p class="subtitle">
        Tu pago fue procesado. Ahora crea tu cuenta y selecciona el horario de tu preferencia.
      </p>

      <form class="register-form" @submit.prevent="handleRegister">
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
              Si no sabes tu nivel, no pasa nada. <b>Si eres principiante no es necesario realizar el diagnóstico para completar tu registro.</b>
              <RouterLink to="/diagnostico">
                (Si consideras que quieres hacerlo hacerlo, haz clic aquí.)
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

        <button type="submit" :disabled="loading">
          {{ loading ? 'Creando cuenta...' : 'Crear mi cuenta' }}
        </button>

        <p v-if="message" :class="['message', messageType]">
          {{ message }}
        </p>
      </form>

      <p class="small-note">
        La asignación final del grupo será confirmada por administración.
      </p>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const router = useRouter()

const loading = ref(false)
const message = ref('')
const messageType = ref('')

const form = ref({
  name: '',
  email: '',
  password: '',
  groupPreference: '',
  wantsToAddDiagnostic: false,
  diagnosticResult: ''
})

const groupOptions = {
  'martes-jueves-8pm': {
    name: 'Martes y jueves',
    schedule: '8:00 pm a 9:30 pm',
    level: 'Nuevo grupo',
    status: 'pending_admin_assignment'
  },
  'lmv-8pm': {
    name: 'Lunes, miércoles y viernes',
    schedule: '8:00 pm a 9:00 pm',
    level: 'Avanzado B1 en adelante',
    status: 'pending_admin_assignment'
  }
}

async function handleRegister() {
  loading.value = true
  message.value = ''
  messageType.value = ''

  try {
    const cleanName = form.value.name.trim()
    const cleanEmail = form.value.email.trim().toLowerCase()
    const password = form.value.password
    const selectedGroup = groupOptions[form.value.groupPreference]

    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password)

    await updateProfile(userCredential.user, {
      displayName: cleanName
    })

    await setDoc(doc(db, 'students', userCredential.user.uid), {
      name: cleanName,
      email: cleanEmail,
      role: 'student',
      status: 'active',
      paymentStatus: 'pending_manual_review',
      source: 'stripe_payment_link',
      groupPreferenceId: form.value.groupPreference,
      groupPreference: selectedGroup,
      assignedGroupId: null,
      assignedByAdmin: false,
      diagnosticResult: form.value.wantsToAddDiagnostic ? form.value.diagnosticResult : null,
      diagnosticSubmitted: form.value.wantsToAddDiagnostic,
      createdAt: serverTimestamp()
    })

    message.value = 'Cuenta creada correctamente. Te estamos redirigiendo a tu espacio.'
    messageType.value = 'success'

    setTimeout(() => {
      router.push('/clase')
    }, 1200)
  } catch (error) {
    console.error(error)

    if (error.code === 'auth/email-already-in-use') {
      message.value = 'Este correo ya tiene una cuenta. Intenta iniciar sesión.'
    } else if (error.code === 'auth/weak-password') {
      message.value = 'La contraseña debe tener al menos 6 caracteres.'
    } else {
      message.value = 'Ocurrió un error al crear tu cuenta. Intenta nuevamente.'
    }

    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
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
</style>