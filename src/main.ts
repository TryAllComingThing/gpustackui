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
import router from './app/router'
import { installAuthGuard } from './app/router/guards'
import './theme/index.css'
initTheme()
initDensity()
initTypography()
initLayout()
initLocale()
installAuthGuard(router)
createApp(App).use(createPinia()).use(i18n).use(router).use(ui).mount('#app')
