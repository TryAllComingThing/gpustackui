import { h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import {
  applyPageSize,
  configureSortableColumn,
  getSelectedIds,
  getSelectedRows,
  initialPagination,
  sameSelectionIds,
  selectionFromIds,
  shouldShowPagination,
  toPageIndex,
  toPageNumber,
} from '../../src/composables/dataTableState'

interface Row {
  id: string
  name: string
}

const rows: Row[] = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }]
const translate = (key: string, named?: Record<string, unknown>) => `${key}:${JSON.stringify(named ?? {})}`

describe('UDataTable helper contract', () => {
  it('uses pageSize only to initialize an uncontrolled pagination model', () => {
    expect(initialPagination(10)).toEqual({ pageIndex: 0, pageSize: 10 })
  })

  it('filters selected rows by the current page data', () => {
    expect(getSelectedRows(rows, { a: true })).toEqual([{ id: 'a', name: 'Alpha' }])
    expect(getSelectedRows(rows, {})).toEqual([])
  })

  it('tracks selection ids across pages without inventing row objects', () => {
    expect(getSelectedIds({ b: true, a: true, c: false })).toEqual(['a', 'b'])
    expect(selectionFromIds(['a', 'c'])).toEqual({ a: true, c: true })
    expect(sameSelectionIds({ a: true, b: true }, { b: true, a: true })).toBe(true)
    expect(sameSelectionIds({ a: true }, { a: true, c: true })).toBe(false)
    expect(getSelectedRows(rows, { a: true, c: true })).toEqual([{ id: 'a', name: 'Alpha' }])
  })

  it('keeps pagination state immutable and converts page numbers safely', () => {
    const pagination = { pageIndex: 0, pageSize: 5 }
    expect(applyPageSize(pagination, 5)).toBe(pagination)
    expect(applyPageSize(pagination, 10)).toEqual({ pageIndex: 0, pageSize: 10 })
    expect(toPageNumber({ pageIndex: 2, pageSize: 10 })).toBe(3)
    expect(toPageIndex(3)).toBe(2)
    expect(toPageIndex(0)).toBe(0)
  })

  it('only shows pagination when data exceeds the page size and is not loading', () => {
    expect(shouldShowPagination(false, 11, 10)).toBe(true)
    expect(shouldShowPagination(false, 10, 10)).toBe(false)
    expect(shouldShowPagination(true, 11, 10)).toBe(false)
  })

  it('adds sort controls only to sortable string-header columns', () => {
    const sortable: TableColumn<Row> = { accessorKey: 'name', header: 'Name', enableSorting: true }
    const toggleSorting = vi.fn()
    const configured = configureSortableColumn(sortable, translate)
    const header = (configured.header as (context: { column: { getIsSorted: () => 'asc'; toggleSorting: () => void } }) => ReturnType<typeof h>)({
      column: { getIsSorted: () => 'asc', toggleSorting },
    })
    expect(header.props?.['aria-label']).toContain('datatable.sortBy')
    expect(header.children).toContain('Name')
    expect(header.children).toContain('↑')

    const fixed: TableColumn<Row> = { accessorKey: 'id', header: 'ID', enableSorting: false }
    expect(configureSortableColumn(fixed, translate)).toBe(fixed)
  })

  it('uses ascending as the first explicit sort direction', () => {
    const sortable: TableColumn<Row> = { accessorKey: 'name', header: 'Name', enableSorting: true }
    const configured = configureSortableColumn(sortable, translate)
    for (const [current, expected] of [['', false], ['asc', true], ['desc', false]] as const) {
      const toggleSorting = vi.fn()
      const header = (configured.header as (context: { column: { getIsSorted: () => string; toggleSorting: (desc?: boolean) => void } }) => ReturnType<typeof h>)({
        column: { getIsSorted: () => current, toggleSorting },
      })
      ;(header.props as { onClick?: () => void } | null)?.onClick?.()
      expect(toggleSorting).toHaveBeenCalledWith(expected)
    }
  })
})
