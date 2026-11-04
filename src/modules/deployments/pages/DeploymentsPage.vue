<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
<template><section class="gp-page" data-testid="production-deployments"><header class="gp-page-header"><div><h1 class="gp-page-title">{{ t('page.deployments.title') }}</h1><p class="gp-secondary">{{ t('page.deployments.subtitle') }}</p></div></header><div class="gp-card"><p class="gp-body">{{ t('page.deployments.empty') }}</p></div></section></template>
