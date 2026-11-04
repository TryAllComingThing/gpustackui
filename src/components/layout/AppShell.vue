<script setup lang="ts">
const sidebarCollapsed = defineModel<boolean>('sidebarCollapsed', { default: false })
</script>

<template>
  <div class="gp-app-shell" :data-collapsed="sidebarCollapsed">
    <header class="gp-app-header">
      <div class="gp-app-header__brand"><slot name="brand">GPUStack</slot></div>
      <slot name="breadcrumb" />
      <div class="gp-app-header__actions"><slot name="actions" /></div>
    </header>
    <div class="gp-app-workspace">
      <aside class="gp-app-sidebar"><slot name="sidebar" /></aside>
      <main class="gp-app-main"><slot /></main>
    </div>
  </div>
</template>
