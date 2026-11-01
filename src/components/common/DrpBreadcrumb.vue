<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui/runtime/components/Breadcrumb.vue'

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <UBreadcrumb :items="items" aria-label="当前位置" data-testid="breadcrumb" class="drp-breadcrumb gp-header-breadcrumb" color="neutral" />
</template>
