import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const showcaseDir = dirname(fileURLToPath(import.meta.url))
export default defineConfig({root:resolve(showcaseDir,'..'),plugins:[vue(),ui()],server:{port:4174,strictPort:true},build:{outDir:'dist-showcase',rollupOptions:{input:resolve(showcaseDir,'index.html')}}})
