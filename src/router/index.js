import { createRouter, createWebHistory } from 'vue-router'
import ClaseView from '../views/ClaseView.vue'

const HomeView = {
  template: `
    <div>
      <h1>Home</h1>
      <p>Bienvenida a Easy Quick</p>
    </div>
  `
}

const LoginView = {
  template: `
    <div>
      <h1>Login</h1>
      <p>Aquí irá el acceso de alumnos</p>
    </div>
  `
}

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/clase',
    name: 'clase',
    component: ClaseView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router