import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const name = process.argv[2]
if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error('Usage: node scripts/create_module.mjs <kebab-case-name>')
  process.exit(1)
}

const root = process.cwd()
const dir = resolve(root, 'src/modules', name, 'pages')
if (existsSync(dir)) {
  console.error(`Module already exists: src/modules/${name}`)
  process.exit(1)
}
mkdirSync(dir, { recursive: true })

const pascal = name
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join('')
const component = `${pascal}Page`

writeFileSync(resolve(dir, `${component}.vue`), `<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
<template><section class="gp-page" data-testid="production-${name}"><header class="gp-page-header"><div><h1 class="gp-page-title">{{ t('page.${name}.title') }}</h1></div></header><div class="gp-card"><p class="gp-body">{{ t('page.${name}.empty') }}</p></div></section></template>
`)

console.log(`Created src/modules/${name}/pages/${component}.vue`)
console.log('Next steps:')
console.log(`1. Add locale keys page.${name}.title and page.${name}.empty to src/locales/zh-CN.ts and en-US.ts`)
console.log(`2. Register a route in src/app/router/index.ts with meta: { titleKey: 'page.${name}.title', breadcrumbKeys: ['nav.${name}'] }`)
console.log(`3. Add a nav item in src/App.vue navItems`)
