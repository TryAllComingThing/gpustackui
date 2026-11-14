<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { productConfig } from '../../../config/product'
import { dashboardStats } from '../fixtures/overview'
const { t } = useI18n()
const productName = productConfig.name
const stats = dashboardStats
</script>
<template><section class="gp-page" data-testid="production-dashboard"><header class="gp-page-header"><div><p class="gp-secondary">{{ productName }}</p><h1 class="gp-page-title">{{ t('page.dashboard.title') }}</h1><p class="gp-secondary">{{ t('page.dashboard.subtitle') }}</p><p class="gp-secondary" data-testid="fixture-notice">{{ t('fixture.notice') }}</p></div></header><div class="gp-page-grid"><article v-for="item in stats" :key="item.id" class="gp-card gp-stat-card"><span class="gp-secondary">{{ t(item.labelKey) }}</span><strong class="gp-kpi">{{ item.value }}</strong><span class="gp-secondary">{{ t(item.hintKey) }}</span></article></div></section></template>
