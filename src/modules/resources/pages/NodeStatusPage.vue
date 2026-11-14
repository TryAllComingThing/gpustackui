<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import UDataTable from '../../../components/common/UDataTable.vue'
import { nodeFixtures, nodeStatusTone, type NodeFixture, type NodeStatus } from '../fixtures/nodes'
const { t } = useI18n()

const rows = nodeFixtures
const statusLabels = computed<Record<NodeStatus, string>>(() => ({
  online: t('page.nodes.statusOnline'),
  maintenance: t('page.nodes.statusMaintenance'),
  offline: t('page.nodes.statusOffline'),
}))
function statusCell(status: NodeStatus) {
  return h('span', { class: ['gp-badge', `gp-badge--${nodeStatusTone[status]}`] }, statusLabels.value[status])
}
const columns = computed<TableColumn<NodeFixture>[]>(() => [
  { accessorKey: 'name', header: t('page.nodes.columnName'), enableSorting: true },
  { accessorKey: 'region', header: t('page.nodes.columnRegion'), enableSorting: true },
  { accessorKey: 'status', header: t('page.nodes.columnStatus'), enableSorting: true, cell: ({ row }) => statusCell(row.original.status) },
  { accessorKey: 'gpu', header: t('page.nodes.columnGpu'), enableSorting: true },
  { accessorKey: 'memory', header: t('page.nodes.columnMemory'), enableSorting: true },
  { accessorKey: 'updatedAt', header: t('page.nodes.columnUpdated'), enableSorting: true },
])
</script>
<template><section class="gp-page" data-testid="production-node-status"><header class="gp-page-header"><div><h1 class="gp-page-title">{{ t('page.nodes.title') }}</h1><p class="gp-secondary">{{ t('page.nodes.subtitle') }}</p><p class="gp-secondary" data-testid="fixture-notice">{{ t('fixture.notice') }}</p></div></header><div class="gp-card"><UDataTable :data="rows" :columns="columns" :empty="t('page.nodes.empty')" :pagination-label="t('page.nodes.pagination')" :page-size="5" /></div></section></template>
