<script setup lang="ts">
import { THEME_IDS } from './theme/theme.types'
import { setTheme, themeState } from './theme/theme.manager'
</script>
<template><main><h1>GPUStack Vue 前端工程骨架</h1><label>主题 <select :value="themeState" @change="setTheme(($event.target as HTMLSelectElement).value as typeof THEME_IDS[number])"><option v-for="id in THEME_IDS" :key="id" :value="id">{{id}}</option></select></label><p>此页面仅用于 M1 结构与主题冒烟验证。</p></main></template>
