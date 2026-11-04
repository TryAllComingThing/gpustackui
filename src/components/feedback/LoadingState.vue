<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  label?: string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="gp-feedback gp-feedback--loading" role="status" aria-live="polite">
    <span class="gp-feedback__spinner" aria-hidden="true"></span>
    <span class="gp-feedback__title">{{ label ?? t('feedback.loading') }}</span>
  </div>
</template>
