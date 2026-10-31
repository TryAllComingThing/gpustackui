<script setup lang="ts">
import { THEME_IDS, type ThemeId } from '../src/theme/theme.types'
import { themeState, setTheme } from '../src/theme/theme.manager'
import { themeRegistry } from '../src/theme/theme.registry'
import ComponentSection from './sections/ComponentSection.vue'
const semanticTokens = [
  { name: 'primary', variable: '--gp-primary' },
  { name: 'success', variable: '--gp-success-fg' },
  { name: 'warning', variable: '--gp-warning-fg' },
  { name: 'danger', variable: '--gp-danger-fg' },
  { name: 'card-bg', variable: '--gp-card-bg' },
  { name: 'page-bg', variable: '--gp-page-bg' },
] as const
function onThemeChange(e: Event) { setTheme((e.target as HTMLSelectElement).value as ThemeId) }
</script>
<template>
  <UApp>
    <div class="showcase-page">
      <header class="showcase-header"><div><p class="eyebrow">GPUStack · M2</p><h1>Theme & Component Showcase</h1><p>开发 / 验收专用，不部署到生产环境</p></div><div class="theme-picker"><label for="theme-select">当前主题</label><select id="theme-select" :value="themeState" @change="onThemeChange"><option v-for="id in THEME_IDS" :key="id" :value="id">{{ themeRegistry[id].label }}</option></select></div></header>
      <section class="gp-card demo-section"><h2>主题语义 Token</h2><div class="swatches"><div v-for="token in semanticTokens" :key="token.variable" class="swatch" :data-token="token.name"><span class="swatch-color" :style="{ backgroundColor: `var(${token.variable})` }"/><code>{{ token.variable }}</code></div></div></section>
      <ComponentSection />
      <footer>主题：{{ themeState }} · 数据为本地 Mock · 不依赖 GPUStack 后端</footer>
    </div>
  </UApp>
</template>
