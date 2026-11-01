<script setup lang="ts">
import { computed, defineAsyncComponent, h, ref } from 'vue'
import { THEME_IDS, type ThemeId } from '../src/theme/theme.types'
import { themeState, setTheme } from '../src/theme/theme.manager'
import { DENSITY_IDS, densityState, setDensity } from '../src/theme/density.manager'
import { layoutState } from '../src/theme/layout.manager'
import { typographyState } from '../src/theme/typography.manager'
import { themeRegistry } from '../src/theme/theme.registry'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import type { NavigationMenuItem } from '@nuxt/ui/runtime/components/NavigationMenu.vue'
import UApp from '@nuxt/ui/runtime/components/App.vue'
import DrpBreadcrumb from '../src/components/common/DrpBreadcrumb.vue'
import DrpDataTable from '../src/components/common/DrpDataTable.vue'
import DrpSidebarNav from '../src/components/common/DrpSidebarNav.vue'
import ComponentSection from './sections/ComponentSection.vue'
import FormSection from './sections/FormSection.vue'
import PatternSection from './sections/PatternSection.vue'
import UserManagementSection from './sections/UserManagementSection.vue'
const ComponentStateSection = defineAsyncComponent(() => import('./sections/ComponentStateSection.vue'))
import { resourceRows, type ResourceRow } from './fixtures/resources'
import { componentMatrix } from './component-matrix'
const tokenGroups = [
  {
    label: '品牌色 Brand',
    tokens: [
      { name: 'G600 · 品牌主色', variable: '--gp-brand-g600' },
      { name: 'G900 · 品牌点击', variable: '--gp-brand-g900' },
      { name: 'G400 · 品牌亮色', variable: '--gp-brand-g400' },
      { name: 'G300 · 品牌浅色', variable: '--gp-brand-g300' },
      { name: 'G100 · 浅色背景', variable: '--gp-brand-g100' },
    ],
  },
  {
    label: '成功色 Success',
    tokens: [
      { name: '默认', variable: '--gp-success-default' },
      { name: '点击', variable: '--gp-success-pressed' },
      { name: '悬浮', variable: '--gp-success-hover' },
      { name: '浅色', variable: '--gp-success-light' },
      { name: '背景', variable: '--gp-success-bg' },
    ],
  },
  {
    label: '警告色 Warning',
    tokens: [
      { name: '默认', variable: '--gp-warning-default' },
      { name: '点击', variable: '--gp-warning-pressed' },
      { name: '悬浮', variable: '--gp-warning-hover' },
      { name: '浅色', variable: '--gp-warning-light' },
      { name: '背景', variable: '--gp-warning-bg' },
    ],
  },
  {
    label: '危险色 Danger',
    tokens: [
      { name: '默认', variable: '--gp-danger-default' },
      { name: '点击', variable: '--gp-danger-pressed' },
      { name: '悬浮', variable: '--gp-danger-hover' },
      { name: '浅色', variable: '--gp-danger-light' },
      { name: '背景', variable: '--gp-danger-bg' },
    ],
  },
  {
    label: '信息色 Info',
    tokens: [
      { name: '默认', variable: '--gp-info-default' },
      { name: '点击', variable: '--gp-info-pressed' },
      { name: '悬浮', variable: '--gp-info-hover' },
      { name: '浅色', variable: '--gp-info-light' },
      { name: '背景', variable: '--gp-info-bg' },
    ],
  },
  {
    label: '文字灰度 Text',
    tokens: [
      { name: 'N900 · 主要文字', variable: '--gp-text-n900' },
      { name: 'N800 · 次级标题', variable: '--gp-text-n800' },
      { name: 'N600 · 次要文字', variable: '--gp-text-n600' },
      { name: 'N500 · 辅助文字', variable: '--gp-text-n500' },
      { name: 'N400 · 弱提示', variable: '--gp-text-n400' },
    ],
  },
  {
    label: '线条灰度 Line',
    tokens: [
      { name: 'N300 · 常规边框', variable: '--gp-line-n300' },
      { name: 'N250 · 分隔线', variable: '--gp-line-n250' },
      { name: 'N200 · 浅线条', variable: '--gp-line-n200' },
    ],
  },
  {
    label: '背景色 Background',
    tokens: [
      { name: '禁用背景', variable: '--gp-background-disabled' },
      { name: 'N150 · 页面背景', variable: '--gp-background-n150' },
      { name: 'N100 · 表头背景', variable: '--gp-background-n100' },
      { name: '白色背景', variable: '--gp-surface-white' },
    ],
  },
  {
    label: '透明度 Alpha（公共）',
    tokens: [
      { name: '黑色 90%', variable: '--gp-alpha-black-90' },
      { name: '黑色 60%', variable: '--gp-alpha-black-60' },
      { name: '黑色 30%', variable: '--gp-alpha-black-30' },
      { name: '黑色 10%', variable: '--gp-alpha-black-10' },
      { name: '黑色 5%', variable: '--gp-alpha-black-5' },
      { name: '白色 90%', variable: '--gp-alpha-white-90' },
      { name: '白色 60%', variable: '--gp-alpha-white-60' },
      { name: '白色 30%', variable: '--gp-alpha-white-30' },
      { name: '白色 10%', variable: '--gp-alpha-white-10' },
      { name: '白色 5%', variable: '--gp-alpha-white-5' },
    ],
  },
] as const
const foundationGroups = [
  {
    label: '字号 Typography',
    tokens: [
      { name: 'XS', variable: '--gp-font-xs', kind: 'font' },
      { name: 'SM', variable: '--gp-font-sm', kind: 'font' },
      { name: 'MD', variable: '--gp-font-md', kind: 'font' },
      { name: 'LG', variable: '--gp-font-lg', kind: 'font' },
      { name: '标题', variable: '--gp-font-title', kind: 'font' },
    ],
  },
  {
    label: '间距 Spacing',
    tokens: [
      { name: '4', variable: '--gp-space-1', kind: 'space' },
      { name: '8', variable: '--gp-space-2', kind: 'space' },
      { name: '12', variable: '--gp-space-3', kind: 'space' },
      { name: '16', variable: '--gp-space-4', kind: 'space' },
      { name: '24', variable: '--gp-space-6', kind: 'space' },
      { name: '32', variable: '--gp-space-8', kind: 'space' },
    ],
  },
  {
    label: '圆角 Radius',
    tokens: [
      { name: '控件', variable: '--gp-radius-control', kind: 'radius' },
      { name: '卡片', variable: '--gp-radius-card', kind: 'radius' },
      { name: '弹窗', variable: '--gp-radius-dialog', kind: 'radius' },
    ],
  },
] as const
const tableMode = ref<'normal' | 'empty' | 'loading'>('normal')
const selectedRows = ref<ResourceRow[]>([])
const tableRows = computed(() => tableMode.value === 'empty' ? [] : [...resourceRows])
const tableColumns: TableColumn<ResourceRow>[] = [
  { accessorKey: 'name', header: '名称', enableSorting: true },
  { accessorKey: 'type', header: '型号', enableSorting: true },
  { accessorKey: 'status', header: '状态', enableSorting: true },
  { accessorKey: 'utilization', header: '利用率', enableSorting: true, cell: ({ getValue }) => `${getValue<number>()}%` },
  { accessorKey: 'owner', header: '负责人', enableSorting: true },
]
const tableModes = [
  { label: '正常数据', value: 'normal' },
  { label: '空状态', value: 'empty' },
  { label: '加载状态', value: 'loading' },
]
const navItems: NavigationMenuItem[] = [
  { label: '概览', value: 'overview', icon: 'i-lucide-layout-dashboard' },
  {
    label: '资源管理', value: 'resources', icon: 'i-lucide-server', type: 'trigger' as const, defaultOpen: true,
    children: [
      { label: 'GPU 资源', value: 'resources-gpu', icon: 'i-lucide-cpu' },
      { label: '节点状态', value: 'resources-nodes', icon: 'i-lucide-activity' },
    ],
  },
  { label: '模型服务', value: 'models', icon: 'i-lucide-box' },
]
const activeNavKey = ref('resources-gpu')
const openNavItems = ref<string[]>(['resources'])
const navCollapsed = ref(false)
const breadcrumbItems = computed(() => [
  { label: '资源管理' },
  { label: activeNavKey.value === 'resources-nodes' ? '节点状态' : 'GPU 资源', active: true },
])
function onThemeChange(e: Event) { setTheme((e.target as HTMLSelectElement).value as ThemeId) }
function onDensityChange(e: Event) { setDensity((e.target as HTMLSelectElement).value as typeof DENSITY_IDS[number]) }
</script>
<template>
  <UApp>
    <div class="showcase-page">
      <header class="showcase-header" data-testid="showcase-header"><div><p class="eyebrow">GPUStack · F4</p><h1>Vue SaaS Design System Showcase</h1><p>独立开发 / 验收入口，不进入生产路由或生产包</p></div><div class="theme-picker"><label for="theme-select">当前主题</label><select id="theme-select" data-testid="theme-select" :value="themeState" @change="onThemeChange"><option v-for="id in THEME_IDS" :key="id" :value="id">{{ themeRegistry[id].label }}</option></select><label for="density-select">当前密度</label><select id="density-select" data-testid="density-select" :value="densityState" @change="onDensityChange"><option v-for="id in DENSITY_IDS" :key="id" :value="id">{{ id }}</option></select></div></header>
      <nav class="showcase-ia-nav" aria-label="Showcase sections" data-testid="showcase-ia-nav"><a href="#section-tokens">Tokens</a><a href="#section-components">Components</a><a href="#section-states">States</a><a href="#section-patterns">Patterns</a><a href="#section-accessibility">Accessibility</a><a href="#section-quality">Quality</a></nav>
      <main class="showcase-main">
      <section id="section-tokens" class="gp-card demo-section token-section" data-testid="section-tokens"><h2>主题色 Token</h2><div v-for="group in tokenGroups" :key="group.label" class="token-group"><h3>{{ group.label }}</h3><div class="swatches"><div v-for="token in group.tokens" :key="token.variable" class="swatch" :data-token="token.variable"><span class="swatch-color" :style="{ backgroundColor: `var(${token.variable})` }"/><strong>{{ token.name }}</strong><code>{{ token.variable }}</code></div></div></div></section>
      <section class="gp-card demo-section" data-testid="section-foundation"><h2>基础 Token</h2><div v-for="group in foundationGroups" :key="group.label" class="token-group"><h3>{{ group.label }}</h3><div class="foundation-tokens"><div v-for="token in group.tokens" :key="token.variable" class="foundation-token" :data-token="token.variable"><span class="foundation-preview" :class="`foundation-preview--${token.kind}`" :style="token.kind === 'font' ? { fontSize: `var(${token.variable})` } : token.kind === 'space' ? { width: `var(${token.variable})` } : { borderRadius: `var(${token.variable})` }">{{ token.name }}</span><code>{{ token.variable }}</code></div></div></div></section>
      <section id="section-components" class="gp-card demo-section" data-testid="section-matrix"><div class="drp-section-heading"><div><h2>组件覆盖矩阵</h2><p>每项使用真实 Nuxt UI 或共享 Drp* 适配组件。</p></div></div><div class="matrix-list"><div v-for="row in componentMatrix" :key="row.id" class="matrix-row" :data-testid="`matrix-${row.id}`"><strong>{{ row.component }}</strong><span>{{ row.implementation }}</span><code>{{ row.states.join(' · ') }}</code></div></div></section>
      <ComponentSection />
      <div id="section-states"><ComponentStateSection /></div>
      <section class="gp-card demo-section drp-navigation-section" data-testid="section-navigation" aria-labelledby="navigation-heading">
        <div class="drp-section-heading"><div><h2 id="navigation-heading">导航 / 面包屑</h2><p>真实 Nuxt UI 导航，支持展开、选中、折叠和键盘访问。</p></div><button type="button" class="gp-button gp-button--outline" @click="navCollapsed = !navCollapsed">{{ navCollapsed ? '展开导航' : '折叠导航' }}</button></div>
        <div class="drp-navigation-layout" :data-nav-collapsed="navCollapsed">
          <DrpSidebarNav v-model:active-key="activeNavKey" v-model:open-items="openNavItems" :items="[...navItems]" :collapsed="navCollapsed" />
          <div class="drp-navigation-content"><DrpBreadcrumb :items="breadcrumbItems" /><p>当前节点：{{ activeNavKey }}</p></div>
        </div>
      </section>
      <section class="gp-card demo-section" data-testid="section-table" aria-labelledby="table-heading">
        <div class="drp-section-heading"><div><h2 id="table-heading">GPU 资源表格 / UTable</h2><p>支持正常、空、加载、排序、分页和选择状态。</p></div><USelect v-model="tableMode" :items="tableModes" aria-label="表格状态" /></div>
        <DrpDataTable :data="tableRows" :columns="tableColumns" :loading="tableMode === 'loading'" :empty="tableMode === 'empty' ? '暂无 GPU 资源' : '暂无数据'" pagination-label="GPU 资源表格分页" selectable :page-size="3" @update:selected-rows="selectedRows = $event" />
        <p class="drp-selection-summary" role="status">已选择 {{ selectedRows.length }} 项资源</p>
      </section>
      <FormSection />
      <div id="section-patterns"><PatternSection /></div>
      <UserManagementSection />
      <section id="section-accessibility" class="gp-card demo-section showcase-contract-section" data-testid="section-accessibility" aria-labelledby="accessibility-heading"><h2 id="accessibility-heading">Accessibility</h2><p>公共组件状态和 Pattern 使用真实标签、错误关联、landmark、焦点、Escape、键盘导航与状态播报。</p><ul><li>UForm / UFormField：label、error、required 关联。</li><li>DrpSidebarNav / DrpBreadcrumb：选中、展开、aria-current 和键盘行为。</li><li>DrpModal / DrpDrawer：焦点陷阱、Escape 和恢复焦点。</li><li>DrpDataTable：排序、分页、空/加载状态和 aria-busy。</li></ul><code>pnpm test:accessibility · pnpm test:strict</code></section>
      <section id="section-quality" class="gp-card demo-section showcase-contract-section" data-testid="section-quality" aria-labelledby="quality-heading"><h2 id="quality-heading">Quality</h2><p>Showcase 只展示本地 fixture；生产与 Showcase 共享 src/theme、Drp* 和 Pattern 实现。</p><div class="quality-grid"><span>Theme：{{ themeState }}</span><span>Density：{{ densityState }}</span><span>Typography：{{ typographyState ? 'saas-v1' : 'pending' }}</span><span>Layout：{{ layoutState.headerHeight }} / {{ layoutState.sidebarExpandedWidth }} / {{ layoutState.sidebarCollapsedWidth }}</span></div><code>pnpm typecheck · pnpm lint · pnpm test:unit · pnpm build · pnpm build:showcase · pnpm test:strict</code></section>
      <footer>主题：{{ themeState }} · 数据为本地 Mock · 不依赖 GPUStack 后端</footer>
      </main>
    </div>
  </UApp>
</template>
