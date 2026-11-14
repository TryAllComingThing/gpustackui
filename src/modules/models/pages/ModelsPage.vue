<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import UDataTable from '../../../components/common/UDataTable.vue'
import { modelFixtures, modelStatusTone, type ModelFixture, type ModelStatus } from '../fixtures/models'
const { t } = useI18n()

const rows = modelFixtures
const statusLabels = computed<Record<ModelStatus, string>>(() => ({
  ready: t('page.models.statusReady'),
  pending: t('page.models.statusPending'),
  failed: t('page.models.statusFailed'),
}))
const columns = computed<TableColumn<ModelFixture>[]>(() => [
  { accessorKey: 'name', header: t('page.models.columnName'), enableSorting: true },
  { accessorKey: 'provider', header: t('page.models.columnProvider'), enableSorting: true },
  {
    accessorKey: 'status',
    header: t('page.models.columnStatus'),
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.original.status
      return h('span', { class: ['gp-badge', `gp-badge--${modelStatusTone[status]}`] }, statusLabels.value[status])
    },
  },
  { accessorKey: 'updatedAt', header: t('page.models.columnUpdated'), enableSorting: true },
])
</script>
<template><section class="gp-page" data-testid="production-models"><header class="gp-page-header"><div><h1 class="gp-page-title">{{ t('page.models.title') }}</h1><p class="gp-secondary">{{ t('page.models.subtitle') }}</p><p class="gp-secondary" data-testid="fixture-notice">{{ t('fixture.notice') }}</p></div></header><div class="gp-card"><UDataTable :data="rows" :columns="columns" :empty="t('page.models.empty')" :pagination-label="t('page.models.pagination')" :page-size="5" /></div></section></template>
