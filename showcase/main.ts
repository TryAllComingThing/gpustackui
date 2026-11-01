import { createApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import { initTheme } from '../src/theme/theme.manager'
import { initDensity } from '../src/theme/density.manager'
import { initTypography } from '../src/theme/typography.manager'
import { initLayout } from '../src/theme/layout.manager'
import '../src/theme/index.css'
import './showcase.css'
initTheme()
initDensity()
initTypography()
initLayout()
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
})
createApp(App).use(router).use(ui).mount('#app')
