<script setup lang="ts" generic="T extends { id: string }">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import type { PaginationState, SortingState } from '@tanstack/vue-table'
import UButton from '@nuxt/ui/runtime/components/Button.vue'
import UDataTable from '../common/UDataTable.vue'

export interface DataTableFilter {
  key: string
  label: string
  options: Array<{ label: string; value: string }>
}

export interface DataTableQuery {
  search: string
  filters: Record<string, string>
  sorting: SortingState
  pagination: PaginationState
}

export interface DataTableResult<T> {
  data: T[]
  total: number
}

export interface DataTableRowAction<T> {
  label: string
  icon?: string
  color?: 'primary' | 'neutral' | 'success' | 'warning' | 'error'
  onSelect: (row: T) => void | Promise<void>
}

const props = withDefaults(defineProps<{
  rows: T[]
  columns: TableColumn<T>[]
  searchKeys?: string[]
  filters?: DataTableFilter[]
  rowActions?: DataTableRowAction<T>[] | ((row: T) => DataTableRowAction<T>[])
  load?: (query: DataTableQuery, signal?: AbortSignal) => Promise<DataTableResult<T>>
  pageSize?: number
  emptyMessage?: string
  ariaLabel?: string
}>(), {
  searchKeys: () => [],
  filters: () => [],
  rowActions: undefined,
  load: undefined,
  pageSize: 5,
  emptyMessage: '暂无数据',
  ariaLabel: '数据表格',
})

const search = ref('')
const filterValues = reactive<Record<string, string>>({})
const ALL_FILTER_VALUE = '__all__'
for (const filter of props.filters) filterValues[filter.key] = ALL_FILTER_VALUE
const loading = ref(false)
const error = ref('')
const remoteRows = ref<T[]>([])
const remoteTotal = ref(0)
const sorting = ref<SortingState>([])
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: props.pageSize })
let requestSequence = 0
let activeController: AbortController | null = null

const visibleRows = computed(() => {
  if (props.load) return remoteRows.value
  const query = search.value.trim().toLowerCase()
  return props.rows.filter((row) => {
    const matchesSearch = !query || props.searchKeys.some((key) => String((row as Record<string, unknown>)[key] ?? '').toLowerCase().includes(query))
    const matchesFilters = props.filters.every((filter) => filterValues[filter.key] === ALL_FILTER_VALUE || String((row as Record<string, unknown>)[filter.key] ?? '') === filterValues[filter.key])
    return matchesSearch && matchesFilters
  })
})
const tableRows = computed<T[]>(() => visibleRows.value as T[])
const isRemote = computed(() => Boolean(props.load))
const totalCount = computed(() => isRemote.value ? remoteTotal.value : tableRows.value.length)

const visibleColumns = computed(() => {
  if (!props.rowActions) return props.columns
  const actionColumn: TableColumn<T> = {
    id: 'actions',
    header: '操作',
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'gp-data-table-pattern__actions' }, getActions(row.original).map((action) => h(UButton, {
      size: 'xs', color: action.color ?? 'neutral', variant: 'ghost', icon: action.icon,
      'aria-label': `${action.label} ${row.original.id}`,
      onClick: () => action.onSelect(row.original),
    }, () => action.label))),
  }
  return [...props.columns, actionColumn]
})

function getActions(row: T) {
  return typeof props.rowActions === 'function' ? props.rowActions(row) : props.rowActions ?? []
}

function currentQuery(): DataTableQuery {
  const filters = Object.fromEntries(Object.entries(filterValues).map(([key, value]) => [key, value === ALL_FILTER_VALUE ? '' : value]))
  return { search: search.value, filters, sorting: [...sorting.value], pagination: { ...pagination.value } }
}

async function loadRows(query = currentQuery()) {
  if (!props.load) return
  const sequence = ++requestSequence
  activeController?.abort()
  const controller = new AbortController()
  activeController = controller
  loading.value = true
  error.value = ''
  try {
    const result = await props.load(query, controller.signal)
    if (sequence !== requestSequence) return
    remoteRows.value = result.data
    remoteTotal.value = result.total
  } catch (cause) {
    if (sequence !== requestSequence || (cause as Error)?.name === 'AbortError') return
    error.value = cause instanceof Error ? cause.message : '数据加载失败'
    remoteRows.value = []
    remoteTotal.value = 0
  } finally {
    if (sequence === requestSequence) {
      loading.value = false
      activeController = null
    }
  }
}

function onQuery(query: { sorting: SortingState; pagination: PaginationState }) {
  void loadRows({ ...currentQuery(), sorting: query.sorting, pagination: query.pagination })
}

watch([search, filterValues], () => {
  pagination.value = { ...pagination.value, pageIndex: 0 }
  if (props.load) void loadRows(currentQuery())
}, { deep: true })
onMounted(() => { void loadRows() })
onBeforeUnmount(() => { activeController?.abort() })
</script>

<template>
  <section class="gp-data-table-pattern" :aria-label="ariaLabel">
    <div class="gp-data-table-pattern__toolbar">
      <UInput v-model="search" type="search" placeholder="搜索" aria-label="搜索表格" class="gp-data-table-pattern__search" />
      <USelect v-for="filter in filters" :key="filter.key" v-model="filterValues[filter.key]" :items="[{ label: '全部', value: ALL_FILTER_VALUE }, ...filter.options]" :aria-label="filter.label" />
    </div>
    <UDataTable
      v-model:sorting="sorting"
      v-model:pagination="pagination"
      :data="tableRows"
      :columns="visibleColumns"
      :page-size="pageSize"
      :total="totalCount"
      :loading="loading"
      :error="error"
      :empty="emptyMessage"
      :server-side="isRemote"
  :pagination-label="`${ariaLabel}分页`"
      @query="onQuery"
    />
  </section>
</template>
