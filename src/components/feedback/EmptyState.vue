<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="gp-feedback gp-feedback--empty" role="status">
    <span class="gp-feedback__mark" aria-hidden="true">✓</span>
    <strong class="gp-feedback__title">{{ title }}</strong>
    <p v-if="description" class="gp-feedback__description">{{ description }}</p>
  </div>
</template>
