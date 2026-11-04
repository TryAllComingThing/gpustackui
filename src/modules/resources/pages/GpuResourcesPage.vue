<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import UDataTable from '../../../components/common/UDataTable.vue'

const { t } = useI18n()

interface GpuResourceRow {
  id: string
  name: string
  model: string
  status: string
  utilization: string
}

const rows = computed<GpuResourceRow[]>(() => [
  { id: 'GPU-RESOURCE-01', name: 'GPU-RESOURCE-01', model: 'A100 · 80GB', status: t('page.gpus.statusRunning'), utilization: '68%' },
  { id: 'GPU-RESOURCE-02', name: 'GPU-RESOURCE-02', model: 'H800 · 80GB', status: t('page.gpus.statusMaintenance'), utilization: '0%' },
])
const columns = computed<TableColumn<GpuResourceRow>[]>(() => [
  { accessorKey: 'name', header: t('page.gpus.columnName'), enableSorting: true },
  { accessorKey: 'model', header: t('page.gpus.columnModel'), enableSorting: true },
  { accessorKey: 'status', header: t('page.gpus.columnStatus'), enableSorting: true },
  { accessorKey: 'utilization', header: t('page.gpus.columnUtilization'), enableSorting: true },
])
</script>
<template><section class="gp-page" data-testid="production-gpu-resources"><header class="gp-page-header"><div><h1 class="gp-page-title">{{ t('page.gpus.title') }}</h1><p class="gp-secondary">{{ t('page.gpus.subtitle') }}</p></div></header><div class="gp-card"><UDataTable :data="rows" :columns="columns" :empty="t('page.gpus.empty')" :pagination-label="t('page.gpus.pagination')" :page-size="5" /></div></section></template>
