<template>
  <div class="login">
    <div class="card">
      <img src="/logo.png" alt="Easy & Quick School" class="logo" />
      <h1>Iniciar sesión</h1>
      <p class="text">Ingresa tus datos para acceder a tu espacio.</p>

      <form @submit.prevent="login">
        <input v-model="usuario" type="email" placeholder="Correo electrónico" autocomplete="email" class="input" required />
        <input v-model="password" type="password" placeholder="Contraseña" autocomplete="current-password" class="input" required />
        <button type="submit" class="btn" :disabled="cargando">{{ cargando ? 'Entrando...' : 'Entrar' }}</button>
      </form>

      <p v-if="aviso" class="notice">{{ aviso }}</p>
      <p v-if="errorMsg" class="error" role="alert">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword, reload } from 'firebase/auth'
import { doc, getDoc, query, collection, where, getDocs, limit } from 'firebase/firestore'
import { auth, db } from '../firebase'

const usuario = ref('')
const password = ref('')
const cargando = ref(false)
const errorMsg = ref('')
const aviso = ref('')
const router = useRouter()

const normalizeEmail = value => String(value || '').trim().toLowerCase()

async function findByEmail(collectionName, email) {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where('email', '==', email), limit(1))
  )
  return snapshot.empty ? null : snapshot.docs[0]
}

async function redirectUserByRole(user) {
  const cleanEmail = normalizeEmail(user.email)

  // Primero comprobamos si es administrador.
  const adminDoc = await getDoc(doc(db, 'admins', user.uid))
  if (adminDoc.exists() && adminDoc.data().role === 'admin') {
    await router.replace('/admin')
    return
  }

  // Los perfiles nuevos pueden tener como ID el UID de Firebase Auth.
  const teacherByUid = await getDoc(doc(db, 'teachers', user.uid))
  if (teacherByUid.exists()) {
    await router.replace('/teacher')
    return
  }

  const studentByUid = await getDoc(doc(db, 'students', user.uid))
  if (studentByUid.exists()) {
    await router.replace('/clase')
    return
  }

  // Compatibilidad con perfiles anteriores guardados con ID automático.
  const teacherByEmail = await findByEmail('teachers', cleanEmail)
  if (teacherByEmail) {
    await router.replace('/teacher')
    return
  }

  const studentByEmail = await findByEmail('students', cleanEmail)
  if (studentByEmail) {
    await router.replace('/clase')
    return
  }

  errorMsg.value = 'Tu cuenta existe, pero aún no tiene un perfil asignado. Contacta a administración.'
}

async function login() {
  errorMsg.value = ''
  aviso.value = ''

  if (!usuario.value || !password.value) {
    errorMsg.value = 'Completa tu correo y contraseña.'
    return
  }

  cargando.value = true
  try {
    const result = await signInWithEmailAndPassword(auth, usuario.value.trim(), password.value)
    const user = result.user
    await reload(user)

    // El estado de verificación no impide el acceso durante el plazo permitido.
    if (!user.emailVerified) {
      aviso.value = 'Tu correo todavía no está verificado. Revisa tu bandeja de entrada para confirmarlo.'
    }

    await redirectUserByRole(user)
  } catch (error) {
    console.error(error)
    errorMsg.value = error.code?.startsWith('auth/')
      ? 'No pudimos iniciar sesión. Revisa tu correo y contraseña.'
      : 'No pudimos cargar tu perfil. Inténtalo de nuevo.'
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.login{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:24px}
.card{width:100%;max-width:420px;background:white;border-radius:20px;padding:40px 28px;box-shadow:0 15px 40px rgba(0,0,0,.25);text-align:center}
.logo{width:120px;margin-bottom:20px}
h1{font-size:32px;margin:0 0 10px;color:#0f172a}
.text{font-size:16px;color:#555;margin-bottom:25px}
.input{width:100%;padding:12px;margin-bottom:12px;border-radius:10px;border:1px solid #ddd;outline:none;box-sizing:border-box}
.input:focus{border-color:#1e3a8a}
.btn{width:100%;background:linear-gradient(90deg,#dc2626,#1e3a8a);color:white;padding:14px;border-radius:12px;font-weight:600;border:none;cursor:pointer;transition:.2s}
.btn:hover{opacity:.9}.btn:disabled{opacity:.7;cursor:not-allowed}
.error{margin-top:14px;color:#dc2626;font-size:14px}
.notice{margin-top:14px;color:#8a4b08;background:#fff4e5;padding:12px;border-radius:10px;font-size:14px}
</style>
