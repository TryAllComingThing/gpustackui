<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import UDataTable from '../../../components/common/UDataTable.vue'
import { serviceFixtures, serviceStatusTone, type ServiceFixture, type ServiceStatus } from '../fixtures/services'
const { t } = useI18n()

const rows = serviceFixtures
const statusLabels = computed<Record<ServiceStatus, string>>(() => ({
  running: t('page.services.statusRunning'),
  degraded: t('page.services.statusDegraded'),
  stopped: t('page.services.statusStopped'),
}))
function statusCell(status: ServiceStatus) {
  const tone = serviceStatusTone[status]
  return h('span', { class: ['gp-badge', tone === 'neutral' ? '' : `gp-badge--${tone}`] }, statusLabels.value[status])
}
const columns = computed<TableColumn<ServiceFixture>[]>(() => [
  { accessorKey: 'name', header: t('page.services.columnName'), enableSorting: true },
  { accessorKey: 'model', header: t('page.services.columnModel'), enableSorting: true },
  { accessorKey: 'replicas', header: t('page.services.columnReplicas'), enableSorting: true },
  { accessorKey: 'status', header: t('page.services.columnStatus'), enableSorting: true, cell: ({ row }) => statusCell(row.original.status) },
  { accessorKey: 'updatedAt', header: t('page.services.columnUpdated'), enableSorting: true },
])
</script>
<template><section class="gp-page" data-testid="production-services"><header class="gp-page-header"><div><h1 class="gp-page-title">{{ t('page.services.title') }}</h1><p class="gp-secondary">{{ t('page.services.subtitle') }}</p><p class="gp-secondary" data-testid="fixture-notice">{{ t('fixture.notice') }}</p></div></header><div class="gp-card"><UDataTable :data="rows" :columns="columns" :empty="t('page.services.empty')" :pagination-label="t('page.services.pagination')" :page-size="5" /></div></section></template>
