import { computed, h, ref, watch, type Ref } from 'vue'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import UCheckbox from '@nuxt/ui/runtime/components/Checkbox.vue'
import type { PaginationState, RowSelectionState, SortingState } from '@tanstack/vue-table'
import {
  configureSortableColumn,
  getDataTablePaginationOptions,
  getSelectedIds,
  getSelectedRows,
  sameSelectionIds,
  selectionFromIds,
  toPageIndex,
  type DataTableQueryState,
  type DataTableTranslate,
} from './dataTableState'

export { getRowId, shouldShowPagination } from './dataTableState'
export type { DataTableQueryState, DataTableTranslate } from './dataTableState'

export interface UseDataTableStateOptions<T extends { id: string }> {
  data: () => T[]
  columns: () => TableColumn<T>[]
  sorting: Ref<SortingState>
  pagination: Ref<PaginationState>
  selectable: () => boolean
  serverSide: () => boolean
  translate: DataTableTranslate
  selectedIds?: () => string[] | undefined
  onSelectionChange: (rows: T[], ids: string[]) => void
  onQuery: (query: DataTableQueryState) => void
}

export function createSelectionColumn<T extends { id: string }>(translate: DataTableTranslate): TableColumn<T> {
  return {
    id: 'select',
    header: ({ table }) => h(UCheckbox, {
      modelValue: table.getIsAllPageRowsSelected(),
      indeterminate: table.getIsSomePageRowsSelected(),
      'aria-label': translate('datatable.selectPage'),
      'onUpdate:modelValue': (value: unknown) => table.toggleAllPageRowsSelected(value === true),
    }),
    cell: ({ row }) => h(UCheckbox, {
      modelValue: row.getIsSelected(),
      disabled: !row.getCanSelect(),
      'aria-label': translate('datatable.selectRow', { id: row.original.id }),
      'onUpdate:modelValue': (value: unknown) => row.toggleSelected(value === true),
    }),
  }
}

export function useDataTableState<T extends { id: string }>(options: UseDataTableStateOptions<T>) {
  const rowSelection = ref<RowSelectionState>(selectionFromIds(options.selectedIds?.()))
  const selectedCount = computed(() => Object.keys(rowSelection.value).length)

  const selectionColumn = computed<TableColumn<T>>(() => createSelectionColumn<T>(options.translate))
  const configuredColumns = computed(() => options.columns().map((column) => configureSortableColumn(column, options.translate)))
  const tableColumns = computed(() => options.selectable() ? [selectionColumn.value, ...configuredColumns.value] : configuredColumns.value)
  const paginationOptions = getDataTablePaginationOptions()

  watch(() => options.selectedIds?.(), (ids) => {
    if (ids === undefined) return
    const next = selectionFromIds(ids)
    if (!sameSelectionIds(rowSelection.value, next)) rowSelection.value = next
  }, { deep: true })

  watch([rowSelection, () => options.data()], ([next]) => {
    options.onSelectionChange(getSelectedRows(options.data(), next), getSelectedIds(next))
  }, { deep: true, immediate: true })

  watch([options.sorting, options.pagination], ([nextSorting, nextPagination]) => {
    if (!options.serverSide()) return
    options.onQuery({ sorting: [...nextSorting], pagination: { ...nextPagination } })
  }, { deep: true })

  function onPageChange(page: number) {
    options.pagination.value = { ...options.pagination.value, pageIndex: toPageIndex(page) }
  }

  return { rowSelection, selectedCount, tableColumns, paginationOptions, onPageChange }
}
