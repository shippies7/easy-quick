<template>
  <div class="login">
    <div class="card">
      <img src="/logo.png" alt="logo" class="logo" />

      <h1>Iniciar sesión</h1>
      <p class="text">
        Ingresa tus datos para acceder a tu espacio.
      </p>

      <input
        v-model="usuario"
        type="email"
        placeholder="Correo electrónico"
        class="input"
      />

      <input
        v-model="password"
        type="password"
        placeholder="Contraseña"
        class="input"
      />

      <button @click="login" class="btn" :disabled="cargando">
        {{ cargando ? 'Entrando...' : 'Entrar' }}
      </button>

      <p v-if="errorMsg" class="error">
        {{ errorMsg }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, query, collection, where, getDocs, limit } from 'firebase/firestore'
import { auth, db } from '../firebase'

const usuario = ref('')
const password = ref('')
const cargando = ref(false)
const errorMsg = ref('')
const router = useRouter()

const normalizeEmail = (value) =>
  String(value || '').trim().toLowerCase()

async function findByEmail(collectionName, email) {
  const q = query(
    collection(db, collectionName),
    where('email', '==', email),
    limit(1)
  )

  const snapshot = await getDocs(q)
  return !snapshot.empty
}

async function redirectUserByRole(user) {
  const cleanEmail = normalizeEmail(user.email)

  const studentByUid = await getDoc(doc(db, 'students', user.uid))

  if (studentByUid.exists()) {
    router.push('/clase')
    return
  }

  const teacherByUid = await getDoc(doc(db, 'teachers', user.uid))

  if (teacherByUid.exists()) {
    router.push('/teacher')
    return
  }

  const studentByEmail = await findByEmail('students', cleanEmail)

  if (studentByEmail) {
    router.push('/clase')
    return
  }

  const teacherByEmail = await findByEmail('teachers', cleanEmail)

  if (teacherByEmail) {
    router.push('/teacher')
    return
  }

  errorMsg.value = 'Tu cuenta existe, pero aún no tiene un perfil asignado. Contacta a administración.'
}

async function login() {
  errorMsg.value = ''

  if (!usuario.value || !password.value) {
    errorMsg.value = 'Completa tu correo y contraseña.'
    return
  }

  try {
    cargando.value = true

    const result = await signInWithEmailAndPassword(
      auth,
      usuario.value.trim(),
      password.value
    )

    await redirectUserByRole(result.user)
  } catch (error) {
    console.error(error)
    errorMsg.value = 'Correo o contraseña incorrectos.'
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a, #1e3a8a);
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 20px;
  padding: 40px 28px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
  text-align: center;
}

.logo {
  width: 120px;
  margin-bottom: 20px;
}

h1 {
  font-size: 32px;
  margin: 0 0 10px;
  color: #0f172a;
}

.text {
  font-size: 16px;
  color: #555;
  margin-bottom: 25px;
}

.input {
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  outline: none;
  box-sizing: border-box;
}

.input:focus {
  border-color: #1e3a8a;
}

.btn {
  width: 100%;
  background: linear-gradient(90deg, #dc2626, #1e3a8a);
  color: white;
  padding: 14px;
  border-radius: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: 0.2s;
}

.btn:hover {
  opacity: 0.9;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  margin-top: 14px;
  color: #dc2626;
  font-size: 14px;
}
</style>