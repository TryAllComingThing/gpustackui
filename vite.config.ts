import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
export default defineConfig({ plugins: [vue(), ui({ icon: { clientBundle: { scan: true } } })], optimizeDeps: { entries: ['index.html'] } })
