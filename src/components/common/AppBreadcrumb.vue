<script setup lang="ts">
import { computed } from 'vue'
import DrpBreadcrumb from './DrpBreadcrumb.vue'
export interface AppBreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

const props = defineProps<{
  items: AppBreadcrumbItem[]
}>()
const normalizedItems = computed(() => props.items.map((item) => ({ label: item.label, href: item.href, active: item.current })))
</script>

<template>
  <DrpBreadcrumb :items="normalizedItems" />
</template>
