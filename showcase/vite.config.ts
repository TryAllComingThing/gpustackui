import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const showcaseDir = dirname(fileURLToPath(import.meta.url))
const showcaseEntryRedirect = (): Plugin => ({
  name: 'showcase-entry-redirect',
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      if (request.url === '/' || request.url === '/index.html') {
        response.statusCode = 302
        response.setHeader('Location', '/showcase/index.html')
        response.end()
        return
      }
      next()
    })
  },
})
export default defineConfig({
  root: resolve(showcaseDir, '..'),
  plugins: [vue(), ui({ icon: { clientBundle: { scan: true } } }), showcaseEntryRedirect()],
  server: {
    port: 4174,
    strictPort: true,
    open: '/showcase/index.html',
  },
  build: {
    outDir: 'dist-showcase',
    rollupOptions: {
      input: resolve(showcaseDir, 'index.html'),
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          const componentMatch = id.match(/@nuxt\/ui\/dist\/runtime\/components\/([^/]+)\.vue/)
          if (componentMatch) {
            const component = componentMatch[1]
            if (['Input', 'Select', 'Form', 'FormField', 'Table', 'Pagination', 'Modal', 'NavigationMenu', 'Breadcrumb', 'Checkbox', 'Badge', 'Card', 'Tabs', 'Empty', 'Skeleton', 'Alert', 'Toast'].includes(component)) {
              return `nuxt-ui-${component.toLowerCase()}`
            }
          }
          if (id.includes('/@nuxt/ui/') || id.includes('/.nuxt-ui/') || id.includes('virtual:nuxt-ui-templates')) return 'nuxt-ui'
          if (id.includes('/vue/') || id.includes('@vue') || id.includes('/vue-router/') || id.includes('/@vueuse/')) return 'vue'
          return undefined
        },
      },
    },
  },
})
