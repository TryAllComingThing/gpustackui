#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const name = args.find((arg) => !arg.startsWith('--'))
const remove = args.includes('--remove')
const withTypes = args.includes('--with-types')
const withApi = args.includes('--with-api')
const withTest = args.includes('--with-test')
const validName = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

if (!name || !validName.test(name)) {
  console.error('Usage: node scripts/create_module.mjs <kebab-case-name> [--with-types] [--with-api] [--with-test] [--remove]')
  process.exit(1)
}

const moduleDir = resolve(root, 'src/modules', name)
const pageDir = resolve(moduleDir, 'pages')
const apiDir = resolve(root, 'src/api', name)
const testFile = resolve(root, 'tests/unit', `${name}-module.spec.ts`)
const marker = `create:module:${name}`
const pascal = name.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('')
const camel = name.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())
const component = `${pascal}Page`
const exportName = `${camel}Routes`

const routerFile = resolve(root, 'src/app/router/routes.ts')
const localeFiles = [resolve(root, 'src/locales/zh-CN.ts'), resolve(root, 'src/locales/en-US.ts')]

function read(path) {
  return readFileSync(path, 'utf8')
}

function insertMarker(text, markerText, line, path) {
  if (!text.includes(markerText)) throw new Error(`Registration marker is missing in ${path}: ${markerText}`)
  return text.replaceAll(markerText, `${markerText}\n${line}`)
}

function removeGeneratedLines() {
  for (const path of [routerFile, ...localeFiles]) {
    const lines = read(path).split('\n')
    writeFileSync(path, lines.filter((line) => !line.includes(marker)).join('\n'))
  }
}

function ensureRegistrationMarkers() {
  for (const [path, markers] of [
    [routerFile, ['// create:module:imports', '// create:module:routes']],
    ...localeFiles.map((path) => [path, ['// create:module:nav', '// create:module:page']]),
  ]) {
    const text = read(path)
    for (const markerText of markers) {
      if (!text.includes(markerText)) throw new Error(`Registration marker is missing in ${path}: ${markerText}`)
    }
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function ensureNoLocaleKeyCollision() {
  for (const path of localeFiles) {
    const text = read(path)
    const pattern = new RegExp(`^\\s*'${escapeRegExp(name)}':`, 'm')
    if (pattern.test(text)) throw new Error(`Locale key already exists in ${path}: ${name}`)
  }
}

function writeTransaction(changes) {
  const originals = new Map()
  const createdDirectories = []
  try {
    for (const [path, content] of changes) {
      if (existsSync(path)) originals.set(path, read(path))
      else {
        const directory = dirname(path)
        if (!existsSync(directory)) {
          mkdirSync(directory, { recursive: true })
          createdDirectories.push(directory)
        }
      }
      writeFileSync(path, content)
    }
  } catch (error) {
    for (const [path, content] of originals) {
      try { writeFileSync(path, content) } catch { /* best-effort rollback */ }
    }
    for (const path of changes.keys()) {
      if (!originals.has(path)) {
        try { rmSync(path, { force: true }) } catch { /* best-effort rollback */ }
      }
    }
    for (const directory of [...createdDirectories].reverse()) {
      try { rmSync(directory, { recursive: true, force: true }) } catch { /* best-effort rollback */ }
    }
    throw error
  }
}

function isGeneratedModule() {
  const readme = resolve(moduleDir, 'README.md')
  return existsSync(readme) && read(readme).includes('generated-by: create:module')
}

if (remove) {
  if (!existsSync(moduleDir)) {
    console.error(`Module does not exist: src/modules/${name}`)
    process.exit(1)
  }
  if (!isGeneratedModule()) {
    console.error(`Refusing to remove a module not created by this generator: src/modules/${name}`)
    process.exit(1)
  }
  const apiReadme = resolve(apiDir, 'README.md')
  if (existsSync(apiReadme) && read(apiReadme).includes('generated-by: create:module')) rmSync(apiDir, { recursive: true, force: true })
  if (existsSync(testFile) && read(testFile).includes('generated-by: create:module')) rmSync(testFile, { force: true })
  rmSync(moduleDir, { recursive: true, force: true })
  removeGeneratedLines()
  console.log(`Removed src/modules/${name} and its generated registrations`)
  process.exit(0)
}

if (existsSync(moduleDir)) {
  console.error(`Module already exists: src/modules/${name}`)
  process.exit(1)
}
if (existsSync(apiDir)) {
  console.error(`API directory already exists: src/api/${name}`)
  process.exit(1)
}
if (existsSync(testFile)) {
  console.error(`Test file already exists: tests/unit/${name}-module.spec.ts`)
  process.exit(1)
}

try {
  ensureRegistrationMarkers()
  ensureNoLocaleKeyCollision()
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

const pageFile = resolve(pageDir, `${component}.vue`)
const routeFile = resolve(moduleDir, 'routes.ts')
const indexFile = resolve(moduleDir, 'index.ts')
const readmeFile = resolve(moduleDir, 'README.md')
const typesFile = resolve(moduleDir, 'types.ts')
const apiIndexFile = resolve(apiDir, 'index.ts')
const apiReadmeFile = resolve(apiDir, 'README.md')
const changes = new Map()

changes.set(pageFile, `<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import EmptyState from '../../../components/feedback/EmptyState.vue'
const { t } = useI18n()
</script>
<template><section class="gp-page" data-testid="production-${name}"><header class="gp-page-header"><div><h1 class="gp-page-title">{{ t('page.${name}.title') }}</h1><p class="gp-page-subtitle">{{ t('page.${name}.subtitle') }}</p></div></header><div class="gp-card"><EmptyState :title="t('page.${name}.empty')" /></div></section></template>
`)

changes.set(routeFile, `import type { RouteRecordRaw } from 'vue-router'

export const ${exportName}: RouteRecordRaw[] = [
  {
    path: '/${name}',
    name: '${name}',
    component: () => import('./pages/${component}.vue'),
    meta: {
      requiresAuth: true,
      titleKey: 'page.${name}.title',
      breadcrumbKeys: ['nav.${name}'],
      nav: { key: '${name}', labelKey: 'nav.${name}', icon: 'i-lucide-box', order: 70 },
    },
  },
]
`)

changes.set(indexFile, `export { ${exportName} } from './routes'
`)

changes.set(readmeFile, `<!-- generated-by: create:module -->
# ${name}

- 页面：\`pages/\`
- 路由：\`routes.ts\`，由 \`src/app/router/routes.ts\` 汇总
- 私有组件：按需新增 \`components/\`，跨模块公共组件上移到 \`src/components/\`
- 私有组合逻辑：按需新增 \`composables/\`
- 领域类型：按需新增 \`types.ts\`
- 后端契约：放在 \`src/api/${name}/\`，模块通过 API 层消费，不直接拼装请求
`)

if (withTypes) {
  changes.set(typesFile, `export interface ${pascal}Item {
  id: string
}

export type ${pascal}Status = 'active' | 'inactive'
`)
}

if (withApi) {
  changes.set(apiIndexFile, `// generated-by: create:module
// Contract placeholder only. Add request functions after the backend contract is defined.
export interface ${pascal}ResourceContract {
  id: string
}
`)
  changes.set(apiReadmeFile, `<!-- generated-by: create:module -->
# ${name} API

This directory is a contract placeholder. Do not invent endpoints or request functions before the backend contract is defined.
`)
}

if (withTest) {
  changes.set(testFile, `// generated-by: create:module
import { describe, expect, it } from 'vitest'
import { ${exportName} } from '../../src/modules/${name}'

describe('${name} module contract', () => {
  it('registers route metadata', () => {
    expect(${exportName}[0]?.meta?.requiresAuth).toBe(true)
    expect(${exportName}[0]?.meta?.public).not.toBe(true)
    expect(${exportName}[0]?.meta?.titleKey).toBe('page.${name}.title')
    expect(${exportName}[0]?.meta?.breadcrumbKeys).toEqual(['nav.${name}'])
  })
})
`)
}

let routerText = insertMarker(read(routerFile), '// create:module:imports', `import { ${exportName} } from '../../modules/${name}' // ${marker}`, routerFile)
routerText = insertMarker(routerText, '// create:module:routes', `  ...${exportName}, // ${marker}`, routerFile)
changes.set(routerFile, routerText)
for (const localeFile of localeFiles) {
  const isZh = localeFile.endsWith('zh-CN.ts')
  const title = isZh ? name : pascal
  const subtitle = isZh ? `管理 ${name} 模块。` : `Manage the ${name} module.`
  const empty = isZh ? '暂无数据' : 'No data yet'
  let localeText = insertMarker(read(localeFile), '// create:module:nav', `    '${name}': '${title}', // ${marker}`, localeFile)
  localeText = insertMarker(localeText, '// create:module:page', `    '${name}': { title: '${title}', subtitle: '${subtitle}', empty: '${empty}' }, // ${marker}`, localeFile)
  changes.set(localeFile, localeText)
}

try {
  writeTransaction(changes)
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

console.log(`Created src/modules/${name}`)
console.log(`Created src/modules/${name}/pages/${component}.vue`)
console.log(`Created src/modules/${name}/routes.ts`)
console.log(`Created src/modules/${name}/index.ts`)
console.log(`Created src/modules/${name}/README.md`)
if (withTypes) console.log(`Created src/modules/${name}/types.ts`)
if (withApi) console.log(`Created src/api/${name}/`)
if (withTest) console.log(`Created tests/unit/${name}-module.spec.ts`)
console.log(`Registered ${exportName} in src/app/router/routes.ts`)
console.log('Registered locale keys in src/locales/zh-CN.ts and src/locales/en-US.ts')
console.log('Run npm run typecheck for this repository, then review the generated module.')
