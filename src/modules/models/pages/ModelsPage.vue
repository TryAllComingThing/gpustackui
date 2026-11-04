<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
<template><section class="gp-page" data-testid="production-models"><header class="gp-page-header"><div><h1 class="gp-page-title">{{ t('page.models.title') }}</h1><p class="gp-secondary">{{ t('page.models.subtitle') }}</p></div></header><div class="gp-card"><p class="gp-body">{{ t('page.models.empty') }}</p></div></section></template>
