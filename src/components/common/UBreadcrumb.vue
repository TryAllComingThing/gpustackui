<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui/runtime/components/Breadcrumb.vue'
import NuxtBreadcrumb from '@nuxt/ui/runtime/components/Breadcrumb.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  items: BreadcrumbItem[]
}>()

const { t } = useI18n()
</script>

<template>
  <NuxtBreadcrumb :items="items" :aria-label="t('aria.breadcrumb')" data-testid="breadcrumb" class="gp-breadcrumb" color="neutral" />
</template>
