import { defineConfig, devices } from '@playwright/test'
export default defineConfig({testDir:'tests/visual',timeout:30000,use:{...devices['Desktop Chrome'],baseURL:'http://localhost:4174'},webServer:{command:'npm run dev:showcase',url:'http://localhost:4174/showcase/index.html',reuseExistingServer:!process.env.CI,timeout:60000}})
