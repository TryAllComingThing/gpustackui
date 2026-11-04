<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
<template><section class="gp-page" data-testid="production-forbidden"><header class="gp-page-header"><div><h1 class="gp-page-title">{{ t('error.forbidden') }}</h1></div></header><div class="gp-card"><p class="gp-body">{{ t('error.forbiddenBody') }}</p></div></section></template>
