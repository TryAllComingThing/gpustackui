<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import UDataTable from '../../../components/common/UDataTable.vue'
import { deploymentFixtures, deploymentStatusTone, type DeploymentFixture, type DeploymentStatus } from '../fixtures/deployments'
const { t } = useI18n()

const rows = deploymentFixtures
const statusLabels = computed<Record<DeploymentStatus, string>>(() => ({
  running: t('page.deployments.statusRunning'),
  queued: t('page.deployments.statusQueued'),
  completed: t('page.deployments.statusCompleted'),
  failed: t('page.deployments.statusFailed'),
}))
function statusCell(status: DeploymentStatus) {
  const tone = deploymentStatusTone[status]
  return h('span', { class: ['gp-badge', tone === 'neutral' ? '' : `gp-badge--${tone}`] }, statusLabels.value[status])
}
const columns = computed<TableColumn<DeploymentFixture>[]>(() => [
  { accessorKey: 'name', header: t('page.deployments.columnName'), enableSorting: true },
  { accessorKey: 'model', header: t('page.deployments.columnModel'), enableSorting: true },
  { accessorKey: 'target', header: t('page.deployments.columnTarget'), enableSorting: true },
  { accessorKey: 'status', header: t('page.deployments.columnStatus'), enableSorting: true, cell: ({ row }) => statusCell(row.original.status) },
  { accessorKey: 'startedAt', header: t('page.deployments.columnStarted'), enableSorting: true },
])
</script>
<template><section class="gp-page" data-testid="production-deployments"><header class="gp-page-header"><div><h1 class="gp-page-title">{{ t('page.deployments.title') }}</h1><p class="gp-secondary">{{ t('page.deployments.subtitle') }}</p><p class="gp-secondary" data-testid="fixture-notice">{{ t('fixture.notice') }}</p></div></header><div class="gp-card"><UDataTable :data="rows" :columns="columns" :empty="t('page.deployments.empty')" :pagination-label="t('page.deployments.pagination')" :page-size="5" /></div></section></template>
