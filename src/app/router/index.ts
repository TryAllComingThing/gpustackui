import { createRouter, createWebHistory } from 'vue-router'
import { appRoutes } from './routes'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: appRoutes,
  scrollBehavior: (_to, _from, savedPosition) => {
    if (savedPosition) return savedPosition
    if (typeof document !== 'undefined') {
      const main = document.querySelector('.gp-app-main')
      if (main instanceof HTMLElement) main.scrollTop = 0
    }
    return { top: 0 }
  },
})
