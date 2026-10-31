import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import { initTheme } from '../src/theme/theme.manager'
import '../src/theme/index.css'
import './showcase.css'
initTheme()
createApp(App).use(ui).mount('#app')
