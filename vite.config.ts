import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { createProductConfig, mergeProductEnv } from './src/config/product-env'

export default defineConfig(({ mode }) => {
  const env = mergeProductEnv(loadEnv(mode, process.cwd(), ''), process.env)
  const productConfig = createProductConfig(env)
  return {
    define: {
      __ENABLE_GPUSTACK_EXAMPLE__: JSON.stringify(productConfig.enableGpuStackExample),
      __ENABLE_DEMO_MODULES__: JSON.stringify(productConfig.enableDemoModules),
    },
    base: productConfig.basePath,
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
    optimizeDeps: { entries: ['index.html', 'src/**/*.ts', 'src/**/*.vue'] },
  }
})
