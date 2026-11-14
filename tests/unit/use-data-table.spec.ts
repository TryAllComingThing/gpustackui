import { effectScope, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import type { PaginationState, SortingState } from '@tanstack/vue-table'
import { useDataTableState } from '../../src/composables/useDataTable'

vi.mock('@nuxt/ui/runtime/components/Checkbox.vue', () => ({ default: {} }))

interface Row {
  id: string
  name: string
}

const columns: TableColumn<Row>[] = [{ accessorKey: 'name', header: 'Name', enableSorting: true }]

describe('useDataTableState controlled selection', () => {
  it('reconciles controlled ids and reports current-page rows with cross-page ids', async () => {
    const data = ref<Row[]>([{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }])
    const selectedIds = ref<string[]>(['a', 'c'])
    const sorting = ref<SortingState>([])
    const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 5 })
    const calls: Array<{ rows: Row[]; ids: string[] }> = []
    const scope = effectScope()
    const state = scope.run(() => useDataTableState<Row>({
      data: () => data.value,
      columns: () => columns,
      sorting,
      pagination,
      selectable: () => true,
      serverSide: () => false,
      selectedIds: () => selectedIds.value,
      translate: (key) => key,
      onSelectionChange: (rows, ids) => calls.push({ rows, ids }),
      onQuery: vi.fn(),
    }))

    expect(state).toBeDefined()
    await nextTick()
    expect(state?.rowSelection.value).toEqual({ a: true, c: true })
    expect(state?.selectedCount.value).toBe(2)
    expect(calls.at(-1)).toEqual({ rows: [{ id: 'a', name: 'Alpha' }], ids: ['a', 'c'] })

    data.value = [{ id: 'c', name: 'Gamma' }, { id: 'd', name: 'Delta' }]
    await nextTick()
    expect(calls.at(-1)).toEqual({ rows: [{ id: 'c', name: 'Gamma' }], ids: ['a', 'c'] })
    expect(state?.selectedCount.value).toBe(2)

    selectedIds.value = ['d']
    await nextTick()
    expect(state?.rowSelection.value).toEqual({ d: true })
    expect(state?.selectedCount.value).toBe(1)
    expect(calls.at(-1)).toEqual({ rows: [{ id: 'd', name: 'Delta' }], ids: ['d'] })
    scope.stop()
  })

  it('does not overwrite a controlled pagination page size', async () => {
    const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })
    const scope = effectScope()
    scope.run(() => useDataTableState<Row>({
      data: () => [{ id: 'a', name: 'Alpha' }],
      columns: () => columns,
      sorting: ref<SortingState>([]),
      pagination,
      selectable: () => false,
      serverSide: () => false,
      translate: (key) => key,
      onSelectionChange: vi.fn(),
      onQuery: vi.fn(),
    }))

    await nextTick()
    expect(pagination.value.pageSize).toBe(10)
    scope.stop()
  })
})
