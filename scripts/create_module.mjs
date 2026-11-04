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
const moduleDir = resolve(root, 'src/modules', name)
const routeName = name

writeFileSync(resolve(dir, `${component}.vue`), `<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import EmptyState from '../../../components/feedback/EmptyState.vue'
const { t } = useI18n()
</script>
<template><section class="gp-page" data-testid="production-${name}"><header class="gp-page-header"><div><h1 class="gp-page-title">{{ t('page.${name}.title') }}</h1></div></header><div class="gp-card"><EmptyState :title="t('page.${name}.empty')" /></div></section></template>
`)

writeFileSync(resolve(moduleDir, 'routes.ts'), `import type { RouteRecordRaw } from 'vue-router'

export const ${name.replace(/-([a-z])/g, (_, char) => char.toUpperCase())}Routes: RouteRecordRaw[] = [
  {
    path: '/${name}',
    name: '${routeName}',
    component: () => import('./pages/${component}.vue'),
    meta: {
      titleKey: 'page.${name}.title',
      breadcrumbKeys: ['nav.${name}'],
      nav: { key: '${name}', labelKey: 'nav.${name}', icon: 'i-lucide-box', order: 70 },
    },
  },
]
`)

const exportName = `${name.replace(/-([a-z])/g, (_, char) => char.toUpperCase())}Routes`
writeFileSync(resolve(moduleDir, 'index.ts'), `export { ${exportName} } from './routes'
`)

writeFileSync(resolve(moduleDir, 'README.md'), `# ${name}

- 页面：\`pages/\`
- 路由：\`routes.ts\`，由 \`src/app/router/routes.ts\` 汇总
- 私有组件：按需新增 \`components/\`，跨模块公共组件上移到 \`src/components/\`
- 私有组合逻辑：按需新增 \`composables/\`
- 领域类型：按需新增 \`types.ts\`
- 后端契约：放在 \`src/api/${name}/\`，模块通过 API 层消费，不直接拼装请求
`)

console.log(`Created src/modules/${name}/pages/${component}.vue`)
console.log(`Created src/modules/${name}/routes.ts`)
console.log(`Created src/modules/${name}/index.ts`)
console.log(`Created src/modules/${name}/README.md`)
console.log('Next steps:')
console.log(`1. Add locale keys page.${name}.title and page.${name}.empty to src/locales/zh-CN.ts and en-US.ts`)
console.log(`2. Import ${exportName} from the module public index into src/app/router/routes.ts`)
console.log(`3. Put backend contracts in src/api/${name}/ and keep module-private UI in src/modules/${name}/components/`)
