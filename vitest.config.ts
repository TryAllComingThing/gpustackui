import { defineConfig } from 'vitest/config'
import { createProductConfig } from './src/config/product-env'

const productConfig = createProductConfig(process.env)

export default defineConfig({
  define: {
    __ENABLE_GPUSTACK_EXAMPLE__: JSON.stringify(productConfig.enableGpuStackExample),
    __ENABLE_DEMO_MODULES__: JSON.stringify(productConfig.enableDemoModules),
  },
  test: { include: ['tests/unit/**/*.spec.ts', 'tests/integration/**/*.spec.ts', 'src/**/*.spec.ts'] },
})
