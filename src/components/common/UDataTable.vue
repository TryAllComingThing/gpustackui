<script setup lang="ts" generic="T extends { id: string }">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import type { PaginationState, SortingState } from '@tanstack/vue-table'
import { getRowId, shouldShowPagination, useDataTableState } from '../../composables/useDataTable'
import { applyPageSize, initialPagination } from '../../composables/dataTableState'
import EmptyState from '../feedback/EmptyState.vue'
import ErrorState from '../feedback/ErrorState.vue'
import LoadingState from '../feedback/LoadingState.vue'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  error?: string
  empty?: string
  caption?: string
  selectable?: boolean
  pageSize?: number
  total?: number
  serverSide?: boolean
  paginationLabel?: string
  retryable?: boolean
}>(), {
  loading: false,
  error: '',
  empty: '',
  selectable: false,
  pageSize: 5,
  serverSide: false,
  paginationLabel: '',
  retryable: false,
})

const emit = defineEmits<{
  'update:selectedRows': [rows: T[]]
  'update:selectedIds': [ids: string[]]
  query: [{ sorting: SortingState; pagination: PaginationState }]
  retry: []
}>()

const sorting = defineModel<SortingState>('sorting', { default: () => [] })
const paginationModel = defineModel<PaginationState>('pagination')
const fallbackPagination = ref<PaginationState>(initialPagination(props.pageSize))
const pagination = computed<PaginationState>({
  get: () => paginationModel.value ?? fallbackPagination.value,
  set: (value) => {
    if (paginationModel.value === undefined) fallbackPagination.value = value
    else paginationModel.value = value
  },
})

watch(() => props.pageSize, (pageSize) => {
  if (paginationModel.value !== undefined) return
  fallbackPagination.value = applyPageSize(fallbackPagination.value, pageSize)
})
const selectedIds = defineModel<string[] | undefined>('selectedIds')
const { rowSelection, selectedCount, tableColumns, paginationOptions, onPageChange } = useDataTableState<T>({
  data: () => props.data,
  columns: () => props.columns,
  sorting,
  pagination,
  selectable: () => props.selectable,
  serverSide: () => props.serverSide,
  selectedIds: () => selectedIds.value,
  translate: (key, named) => t(key, named ?? {}),
  onSelectionChange: (rows, ids) => {
    emit('update:selectedRows', rows)
    emit('update:selectedIds', ids)
  },
  onQuery: (query) => emit('query', query),
})
</script>

<template>
  <div class="gp-data-table" :aria-busy="loading || undefined">
    <ErrorState v-if="error" :message="error" :show-retry="retryable" class="gp-data-table__error" @retry="emit('retry')" />
    <UTable
      v-else
      v-model:sorting="sorting"
      v-model:row-selection="rowSelection"
      v-model:pagination="pagination"
      :data="data"
      :columns="tableColumns"
      :loading="loading"
      :caption="caption || t('datatable.label')"
      :empty="empty || t('datatable.empty')"
      :sorting-options="{ enableSorting: true, enableSortingRemoval: false, manualSorting: serverSide }"
      :row-selection-options="{ enableRowSelection: selectable }"
      :pagination-options="{ ...paginationOptions, manualPagination: serverSide }"
      :get-row-id="getRowId"
      class="gp-data-table__table"
    >
      <template #loading><LoadingState :label="t('datatable.loading')" /></template>
      <template #empty><EmptyState :title="empty || t('datatable.empty')" /></template>
    </UTable>
    <span v-if="selectable" class="gp-data-table__summary" role="status" aria-live="polite">{{ t('datatable.selected', { count: selectedCount }) }}</span>
    <div v-if="!error && shouldShowPagination(loading, total ?? data.length, pagination.pageSize)" class="gp-data-table__footer">
      <UPagination
        :page="pagination.pageIndex + 1"
        :total="total ?? data.length"
        :items-per-page="pagination.pageSize"
        color="primary"
        variant="outline"
        :aria-label="paginationLabel || t('datatable.pagination')"
        @update:page="onPageChange"
      />
    </div>
  </div>
</template>
