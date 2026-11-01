<script setup lang="ts">
import type { DrawerDirection } from 'vaul-vue'

const open = defineModel<boolean>('open', { default: false })

withDefaults(defineProps<{
  title?: string
  description?: string
  direction?: DrawerDirection
  dismissible?: boolean
}>(), {
  direction: 'right',
  dismissible: true,
})
</script>

<template>
  <UDrawer v-model:open="open" :title="title" :description="description" :direction="direction" :dismissible="dismissible" close data-testid="drp-drawer">
    <template #default="slotProps"><slot v-bind="slotProps" /></template>
    <template #header="slotProps"><slot name="header" v-bind="slotProps" /></template>
    <template #body="slotProps"><slot name="body" v-bind="slotProps" /></template>
    <template #footer="slotProps"><slot name="footer" v-bind="slotProps" /></template>
  </UDrawer>
</template>
