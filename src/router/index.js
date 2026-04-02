import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ClaseView from '../views/ClaseView.vue'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import TeacherView from '../views/TeacherView.vue'
import { getCurrentUser, db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

const normalizeEmail = (value) =>
  String(value || '').trim().toLowerCase()

async function getUserRoleByEmail(email) {
  const cleanEmail = normalizeEmail(email)

  const teachersSnapshot = await getDocs(collection(db, 'teachers'))
  const teacherFound = teachersSnapshot.docs.find((docItem) => {
    const data = docItem.data()
    return normalizeEmail(data.email) === cleanEmail
  })

  if (teacherFound) return 'teacher'

  const studentsSnapshot = await getDocs(collection(db, 'students'))
  const studentFound = studentsSnapshot.docs.find((docItem) => {
    const data = docItem.data()
    return normalizeEmail(data.email) === cleanEmail
  })

  if (studentFound) return 'student'

  return null
}

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Easy & Quick School' }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true, title: 'Iniciar sesión | Easy & Quick School' }
  },
  {
    path: '/clase',
    name: 'clase',
    component: ClaseView,
    meta: { requiresAuth: true, title: 'Tu espacio | Easy & Quick School' }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { requiresAuth: true, title: 'Admin | Easy & Quick School' }
  },
  {
    path: '/teacher',
    name: 'teacher',
    component: TeacherView,
    meta: { requiresAuth: true, title: 'Panel Maestro | Easy & Quick School' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const user = await getCurrentUser()

  if (to.meta.requiresAuth && !user) {
    return '/login'
  }

  if (to.meta.guestOnly && user) {
    const role = await getUserRoleByEmail(user.email)

    if (role === 'teacher') return '/teacher'
    if (role === 'student') return '/clase'

    return '/login'
  }

  if (user && (to.path === '/teacher' || to.path === '/clase')) {
    const role = await getUserRoleByEmail(user.email)

    if (role === 'teacher' && to.path === '/clase') {
      return '/teacher'
    }

    if (role === 'student' && to.path === '/teacher') {
      return '/clase'
    }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title || 'Easy & Quick School'
})

export default router