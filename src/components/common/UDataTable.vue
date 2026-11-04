<script setup lang="ts" generic="T extends { id: string }">
import { computed, h, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import UCheckbox from '@nuxt/ui/runtime/components/Checkbox.vue'
import type { PaginationState, RowSelectionState, SortingState } from '@tanstack/vue-table'
import { getPaginationRowModel } from '@tanstack/vue-table'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  error?: string
  empty?: string
  selectable?: boolean
  pageSize?: number
  total?: number
  serverSide?: boolean
  paginationLabel?: string
}>(), {
  loading: false,
  error: '',
  empty: '',
  selectable: false,
  pageSize: 5,
  serverSide: false,
  paginationLabel: '',
})

const emit = defineEmits<{
  select: [row: T]
  'update:selectedRows': [rows: T[]]
  query: [{ sorting: SortingState; pagination: PaginationState }]
}>()

const sorting = defineModel<SortingState>('sorting', { default: () => [] })
const rowSelection = ref<RowSelectionState>({})
const pagination = defineModel<PaginationState>('pagination', { default: () => ({ pageIndex: 0, pageSize: 5 }) })

watch(() => props.pageSize, (pageSize) => {
  if (pagination.value.pageSize !== pageSize) pagination.value = { ...pagination.value, pageSize }
}, { immediate: true })

const selectionColumn = computed<TableColumn<T>>(() => ({
  id: 'select',
  header: ({ table }) => h(UCheckbox, {
    modelValue: table.getIsAllPageRowsSelected(),
    indeterminate: table.getIsSomePageRowsSelected(),
    'aria-label': t('datatable.selectPage'),
    'onUpdate:modelValue': (value: unknown) => table.toggleAllPageRowsSelected(value === true),
  }),
  cell: ({ row }) => h(UCheckbox, {
    modelValue: row.getIsSelected(),
    disabled: !row.getCanSelect(),
    'aria-label': t('datatable.selectRow', { id: row.original.id }),
    'onUpdate:modelValue': (value: unknown) => row.toggleSelected(value === true),
  }),
}))

function configureColumn(column: TableColumn<T>): TableColumn<T> {
  if (typeof column.header !== 'string' || column.enableSorting === false) return column
  const label = column.header
  return {
    ...column,
    header: ({ column: tableColumn }) => h('button', {
      type: 'button',
      class: 'gp-data-table__sort',
      'aria-label': t('datatable.sortBy', { label }),
      onClick: () => tableColumn.toggleSorting(),
    }, `${label} ${tableColumn.getIsSorted() === 'asc' ? '↑' : tableColumn.getIsSorted() === 'desc' ? '↓' : '↕'}`),
  } as TableColumn<T>
}

const configuredColumns = computed(() => props.columns.map(configureColumn))
const tableColumns = computed(() => props.selectable ? [selectionColumn.value, ...configuredColumns.value] : configuredColumns.value)
const getRowId = (row: T) => row.id
const paginationOptions = { getPaginationRowModel: getPaginationRowModel() }

watch(rowSelection, (next) => {
  emit('update:selectedRows', props.data.filter((row) => Boolean(next[row.id])))
}, { deep: true })

watch([sorting, pagination], ([nextSorting, nextPagination]) => {
  if (!props.serverSide) return
  emit('query', { sorting: [...nextSorting], pagination: { ...nextPagination } })
}, { deep: true })

function onPageChange(page: number) {
  pagination.value = { ...pagination.value, pageIndex: page - 1 }
}

function onRowSelect(event: Event, row: { original: T }) {
  emit('select', row.original)
}
</script>

<template>
  <div class="gp-data-table" :aria-busy="loading || undefined">
    <UAlert v-if="error" color="error" variant="subtle" :title="error" role="alert" class="gp-data-table__error" />
    <UTable
      v-model:sorting="sorting"
      v-model:row-selection="rowSelection"
      v-model:pagination="pagination"
      :data="data"
      :columns="tableColumns"
      :loading="loading"
      :empty="empty || t('datatable.empty')"
      :sorting-options="{ enableSorting: true, enableSortingRemoval: false, manualSorting: serverSide }"
      :row-selection-options="{ enableRowSelection: selectable }"
      :pagination-options="{ ...paginationOptions, manualPagination: serverSide }"
      :get-row-id="getRowId"
      class="gp-data-table__table"
      @select="onRowSelect"
    />
    <p v-if="loading" class="sr-only" role="status" aria-live="polite">{{ t('datatable.loading') }}</p>
    <p v-else-if="!data.length" class="sr-only" role="status" aria-live="polite">{{ t('datatable.emptyState') }}</p>
    <div v-if="!loading && (total ?? data.length) > pageSize" class="gp-data-table__footer">
      <span class="gp-data-table__summary">{{ t('datatable.selected', { count: Object.keys(rowSelection).length }) }}</span>
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
