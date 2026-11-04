<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  title?: string
  message: string
  retryLabel?: string
}>()

defineEmits<{ retry: [] }>()

const { t } = useI18n()
</script>

<template>
  <div class="gp-feedback gp-feedback--error" role="alert">
    <span class="gp-feedback__mark" aria-hidden="true">!</span>
    <strong class="gp-feedback__title">{{ title ?? t('feedback.loadFailed') }}</strong>
    <p class="gp-feedback__description">{{ message }}</p>
    <UButton type="button" color="neutral" variant="outline" @click="$emit('retry')">{{ retryLabel ?? t('feedback.retry') }}</UButton>
  </div>
</template>
