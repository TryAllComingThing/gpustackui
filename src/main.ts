import { createApp } from 'vue'
import App from './App.vue'
import { initTheme } from './theme/theme.manager'
import './theme/index.css'
initTheme()
createApp(App).mount('#app')
