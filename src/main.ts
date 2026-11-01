import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import { initTheme } from './theme/theme.manager'
import { initDensity } from './theme/density.manager'
import { initTypography } from './theme/typography.manager'
import { initLayout } from './theme/layout.manager'
import router from './app/router'
import './theme/index.css'
initTheme()
initDensity()
initTypography()
initLayout()
createApp(App).use(router).use(ui).mount('#app')
