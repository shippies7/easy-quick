
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ClaseView from '../views/ClaseView.vue'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import TeacherView from '../views/TeacherView.vue'
import PlanesView from '../views/PlanesView.vue'
import RegisterAfterPaymentView from '../views/RegisterAfterPaymentView.vue'
import DiagnosticoView from '../views/DiagnosticoView.vue'

import { getCurrentUser, db } from '../firebase'
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore'

const normalizeEmail = (value) =>
  String(value || '').trim().toLowerCase()

async function findProfileByEmail(collectionName, email) {
  if (!email) return false

  const snapshot = await getDocs(
    query(
      collection(db, collectionName),
      where('email', '==', email),
      limit(1)
    )
  )

  return !snapshot.empty
}

async function getUserRole(user) {
  if (!user) return null

  // 1. Verificar administrador por UID
  const adminDoc = await getDoc(doc(db, 'admins', user.uid))

  if (
    adminDoc.exists() &&
    adminDoc.data().role === 'admin'
  ) {
    return 'admin'
  }

  // 2. Verificar profesor por UID
  const teacherDoc = await getDoc(doc(db, 'teachers', user.uid))

  if (teacherDoc.exists()) {
    return 'teacher'
  }

  // 3. Verificar alumno por UID
  const studentDoc = await getDoc(doc(db, 'students', user.uid))

  if (studentDoc.exists()) {
    return 'student'
  }

  // 4. Buscar perfiles antiguos por correo
  const email = normalizeEmail(user.email)

  if (!email) return null

  const teacherByEmail = await findProfileByEmail(
    'teachers',
    email
  )

  if (teacherByEmail) {
    return 'teacher'
  }

  const studentByEmail = await findProfileByEmail(
    'students',
    email
  )

  if (studentByEmail) {
    return 'student'
  }

  return null
}

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: 'Easy & Quick School'
    }
  },
  {
    path: '/planes',
    name: 'planes',
    component: PlanesView,
    meta: {
      title: 'Planes | Easy & Quick School'
    }
  },
  {
    path: '/registro-pagado',
    name: 'registro-pagado',
    component: RegisterAfterPaymentView,
    meta: {
      title: 'Registro | Easy & Quick School'
    }
  },
  {
    path: '/diagnostico',
    name: 'diagnostico',
    component: DiagnosticoView,
    meta: {
      title: 'Examen diagnóstico | Easy & Quick School'
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      guestOnly: true,
      title: 'Iniciar sesión | Easy & Quick School'
    }
  },
  {
    path: '/clase',
    name: 'clase',
    component: ClaseView,
    meta: {
      requiresAuth: true,
      requiredRole: 'student',
      title: 'Tu espacio | Easy & Quick School'
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: {
      requiresAuth: true,
      requiredRole: 'admin',
      title: 'Admin | Easy & Quick School'
    }
  },
  {
    path: '/teacher',
    name: 'teacher',
    component: TeacherView,
    meta: {
      requiresAuth: true,
      requiredRole: 'teacher',
      title: 'Panel Maestro | Easy & Quick School'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const user = await getCurrentUser()

  // Si necesita iniciar sesión
  if (to.meta.requiresAuth && !user) {
    return '/login'
  }

  // Permitir acceso público
  if (!user) {
    return true
  }

  // Permitir completar el registro después del pago
  if (to.path === '/registro-pagado') {
    return true
  }

  let role = null

  try {
    role = await getUserRole(user)
  } catch (error) {
    console.error(
      'Error al verificar el perfil del usuario:',
      error
    )

    // No conceder acceso si no se puede verificar el rol
    if (to.meta.requiresAuth) {
      return '/'
    }

    return true
  }

  // Redirigir usuarios autenticados desde login
  if (to.meta.guestOnly) {
    if (role === 'admin') {
      return '/admin'
    }

    if (role === 'teacher') {
      return '/teacher'
    }

    if (role === 'student') {
      return '/clase'
    }

    return true
  }

  // Verificar permisos por rol
  if (
    to.meta.requiredRole &&
    role !== to.meta.requiredRole
  ) {
    if (role === 'admin') {
      return '/admin'
    }

    if (role === 'teacher') {
      return '/teacher'
    }

    if (role === 'student') {
      return '/clase'
    }

    return '/'
  }

  return true
})

router.afterEach((to) => {
  document.title =
    to.meta.title || 'Easy & Quick School'
})

export default router
