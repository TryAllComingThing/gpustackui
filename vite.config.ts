import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      icon: {
        clientBundle: {
          scan: {
            globInclude: ['**/*.{vue,jsx,tsx,ts,md,mdc,mdx,yml,yaml}'],
          },
        },
      },
    }),
  ],
  optimizeDeps: { entries: ['index.html'] },
})
