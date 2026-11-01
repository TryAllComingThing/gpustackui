<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

withDefaults(defineProps<{
  title?: string
  description?: string
  dismissible?: boolean
}>(), {
  dismissible: true,
})
</script>

<template>
  <UModal v-model:open="open" :title="title" :description="description" :dismissible="dismissible" data-testid="drp-modal">
    <template #default="slotProps"><slot v-bind="slotProps" /></template>
    <template #header="slotProps"><slot name="header" v-bind="slotProps" /></template>
    <template #body="slotProps"><slot name="body" v-bind="slotProps" /></template>
    <template #footer="slotProps"><slot name="footer" v-bind="slotProps" /></template>
  </UModal>
</template>
