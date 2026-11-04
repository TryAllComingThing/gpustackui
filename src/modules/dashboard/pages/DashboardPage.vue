<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const stats = computed(() => [
  { label: t('page.dashboard.statGpu'), value: '68%' },
  { label: t('page.dashboard.statNodes'), value: '12' },
  { label: t('page.dashboard.statServices'), value: '8' },
])
</script>
<template><section class="gp-page" data-testid="production-dashboard"><header class="gp-page-header"><div><p class="gp-secondary">GPUStack</p><h1 class="gp-page-title">{{ t('page.dashboard.title') }}</h1><p class="gp-secondary">{{ t('page.dashboard.subtitle') }}</p></div></header><div class="gp-page-grid"><article v-for="item in stats" :key="item.label" class="gp-card gp-stat-card"><span class="gp-secondary">{{ item.label }}</span><strong class="gp-kpi">{{ item.value }}</strong></article></div></section></template>
