import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import type { PaginationState, RowSelectionState, SortingState } from '@tanstack/vue-table'
import { getPaginationRowModel } from '@tanstack/vue-table'

export type DataTableTranslate = (key: string, named?: Record<string, unknown>) => string

export interface DataTableQueryState {
  sorting: SortingState
  pagination: PaginationState
}

export function getRowId<T extends { id: string }>(row: T): string {
  return row.id
}

export function getSelectedRows<T extends { id: string }>(data: T[], selection: RowSelectionState): T[] {
  return data.filter((row) => Boolean(selection[row.id]))
}

export function getSelectedIds(selection: RowSelectionState): string[] {
  return Object.keys(selection).filter((id) => Boolean(selection[id])).sort()
}

export function selectionFromIds(ids: string[] | undefined): RowSelectionState {
  return Object.fromEntries((ids ?? []).map((id) => [id, true]))
}

export function sameSelectionIds(left: RowSelectionState, right: RowSelectionState): boolean {
  const leftIds = getSelectedIds(left)
  const rightIds = getSelectedIds(right)
  return leftIds.length === rightIds.length && leftIds.every((id, index) => id === rightIds[index])
}

export function applyPageSize(pagination: PaginationState, pageSize: number): PaginationState {
  return pagination.pageSize === pageSize ? pagination : { ...pagination, pageSize }
}

export function initialPagination(pageSize: number): PaginationState {
  return { pageIndex: 0, pageSize }
}

export function toPageNumber(pagination: PaginationState): number {
  return pagination.pageIndex + 1
}

export function toPageIndex(page: number): number {
  return Math.max(0, page - 1)
}

export function shouldShowPagination(loading: boolean, total: number, pageSize: number): boolean {
  return !loading && total > pageSize
}

export function getDataTablePaginationOptions() {
  return { getPaginationRowModel: getPaginationRowModel() }
}

export function configureSortableColumn<T extends { id: string }>(column: TableColumn<T>, translate: DataTableTranslate): TableColumn<T> {
  if (typeof column.header !== 'string' || column.enableSorting === false) return column
  const label = column.header
  return {
    ...column,
    header: ({ column: tableColumn }) => h('button', {
      type: 'button',
      class: 'gp-data-table__sort',
      'aria-label': translate('datatable.sortBy', { label }),
      onClick: () => tableColumn.toggleSorting(tableColumn.getIsSorted() === 'asc'),
    }, `${label} ${tableColumn.getIsSorted() === 'asc' ? '↑' : tableColumn.getIsSorted() === 'desc' ? '↓' : '↕'}`),
  } as TableColumn<T>
}
