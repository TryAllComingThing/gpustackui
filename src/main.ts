import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import { i18n } from './locales'
import { initLocale } from './locales/locale.manager'
import { initTheme } from './theme/theme.manager'
import { initDensity } from './theme/density.manager'
import { initTypography } from './theme/typography.manager'
import { initLayout } from './theme/layout.manager'
import { initAppearance } from './theme/appearance.manager'
import router from './app/router'
import { installAuthGuard } from './app/router/guards'
import { registerSessionNavigationHandlers } from './services/auth/session-events'
import { useAuthStore } from './stores/auth'
import './theme/index.css'
initTheme()
initDensity()
initTypography()
initLayout()
initAppearance()
initLocale()

const pinia = createPinia()

async function bootstrap() {
  const app = createApp(App).use(pinia)
  const auth = useAuthStore(pinia)

  registerSessionNavigationHandlers({
    onUnauthorized: async () => {
      auth.handleUnauthorized()
      const current = router.currentRoute.value
      if (current.name === 'login') return
      await router.replace({ name: 'login', query: { redirect: current.fullPath } })
    },
    onForbidden: async () => {
      const current = router.currentRoute.value
      if (current.name === 'login' || current.name === 'forbidden') return
      await router.replace({ name: 'forbidden' })
    },
  })

  installAuthGuard(router, { loginRouteName: 'login', defaultRouteName: 'dashboard', forbiddenRouteName: 'forbidden' })
  app.use(router)
  await router.isReady()
  app.use(i18n).use(ui).mount('#app')
}

void bootstrap()
