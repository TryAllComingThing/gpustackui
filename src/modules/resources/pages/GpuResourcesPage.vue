<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import DrpDataTable from '../../../components/common/DrpDataTable.vue'

interface GpuResourceRow {
  id: string
  name: string
  model: string
  status: string
  utilization: string
}

const rows = [
  { id: 'GPU-RESOURCE-01', name: 'GPU-RESOURCE-01', model: 'A100 · 80GB', status: '运行中', utilization: '68%' },
  { id: 'GPU-RESOURCE-02', name: 'GPU-RESOURCE-02', model: 'H800 · 80GB', status: '维护中', utilization: '0%' },
] satisfies GpuResourceRow[]
const columns: TableColumn<GpuResourceRow>[] = [
  { accessorKey: 'name', header: '名称', enableSorting: true },
  { accessorKey: 'model', header: '型号', enableSorting: true },
  { accessorKey: 'status', header: '状态', enableSorting: true },
  { accessorKey: 'utilization', header: '利用率', enableSorting: true },
]
</script>
<template><section class="gp-page" data-testid="production-gpu-resources"><header class="gp-page-header"><div><h1 class="gp-page-title">GPU 资源</h1><p class="gp-secondary">查看 GPU 卡的容量、状态和利用率。</p></div></header><div class="gp-card"><DrpDataTable :data="rows" :columns="columns" :empty="'暂无 GPU 资源'" pagination-label="GPU 资源分页" :page-size="5" /></div></section></template>
