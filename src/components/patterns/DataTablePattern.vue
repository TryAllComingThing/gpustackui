<script setup lang="ts" generic="T extends { id: string }">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import type { PaginationState, SortingState } from '@tanstack/vue-table'
import UButton from '@nuxt/ui/runtime/components/Button.vue'
import UDataTable from '../common/UDataTable.vue'
import { applyPageSize } from '../../composables/dataTableState'
import { createDebouncedTask } from '../../utils/debounce'

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

const { t } = useI18n()

const props = withDefaults(defineProps<{
  rows: T[]
  columns: TableColumn<T>[]
  searchKeys?: string[]
  filters?: DataTableFilter[]
  rowActions?: DataTableRowAction<T>[] | ((row: T) => DataTableRowAction<T>[])
  load?: (query: DataTableQuery, signal?: AbortSignal) => Promise<DataTableResult<T>>
  pageSize?: number
  debounceMs?: number
  emptyMessage?: string
  ariaLabel?: string
}>(), {
  searchKeys: () => [],
  filters: () => [],
  rowActions: undefined,
  load: undefined,
  pageSize: 5,
  debounceMs: 300,
  emptyMessage: undefined,
  ariaLabel: undefined,
})

const resolvedEmptyMessage = computed(() => props.emptyMessage ?? t('patterns.datatable.empty'))
const resolvedAriaLabel = computed(() => props.ariaLabel ?? t('patterns.datatable.label'))

const search = ref('')
const filterValues = reactive<Record<string, string>>({})
const ALL_FILTER_VALUE = '__all__'
const loading = ref(false)
const error = ref('')
const remoteRows = ref<T[]>([])
const remoteTotal = ref(0)
const sorting = ref<SortingState>([])
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: props.pageSize })
let requestSequence = 0
let activeController: AbortController | null = null
let skipNextTableQuery = false

watch(() => props.filters, (filters) => {
  const activeKeys = new Set(filters.map((filter) => filter.key))
  for (const filter of filters) {
    if (!(filter.key in filterValues)) filterValues[filter.key] = ALL_FILTER_VALUE
  }
  for (const key of Object.keys(filterValues)) {
    if (!activeKeys.has(key)) delete filterValues[key]
  }
}, { deep: true, immediate: true })

const searchableKeys = computed(() => props.searchKeys.length
  ? props.searchKeys
  : Object.keys((props.rows[0] as Record<string, unknown> | undefined) ?? {}).filter((key) => key !== 'id'))

const visibleRows = computed(() => {
  if (props.load) return remoteRows.value
  const query = search.value.trim().toLowerCase()
  return props.rows.filter((row) => {
    const matchesSearch = !query || searchableKeys.value.some((key) => String((row as Record<string, unknown>)[key] ?? '').toLowerCase().includes(query))
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
    header: t('patterns.datatable.actions'),
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'gp-data-table-pattern__actions' }, getActions(row.original).map((action) => h(UButton, {
      size: 'xs', color: action.color ?? 'neutral', variant: 'ghost', icon: action.icon,
      'aria-label': `${action.label} ${row.original.id}`,
      onClick: () => { void executeRowAction(action, row.original) },
    }, () => action.label))),
  }
  return [...props.columns, actionColumn]
})

function getActions(row: T) {
  return typeof props.rowActions === 'function' ? props.rowActions(row) : props.rowActions ?? []
}

async function executeRowAction(action: DataTableRowAction<T>, row: T) {
  error.value = ''
  try {
    await action.onSelect(row)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('patterns.datatable.actionError')
  }
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
    error.value = cause instanceof Error ? cause.message : t('patterns.datatable.loadError')
    remoteRows.value = []
    remoteTotal.value = 0
  } finally {
    if (sequence === requestSequence) {
      loading.value = false
      activeController = null
    }
  }
}

const debouncedRemoteLoad = createDebouncedTask(() => { void loadRows() })

function onQuery(query: { sorting: SortingState; pagination: PaginationState }) {
  if (skipNextTableQuery) {
    skipNextTableQuery = false
    return
  }
  debouncedRemoteLoad.cancel()
  void loadRows({ ...currentQuery(), sorting: query.sorting, pagination: query.pagination })
}

watch([search, filterValues], () => {
  if (!props.load) return
  if (pagination.value.pageIndex !== 0) {
    skipNextTableQuery = true
    pagination.value = { ...pagination.value, pageIndex: 0 }
  }
  debouncedRemoteLoad.schedule(props.debounceMs)
}, { deep: true })

watch(() => props.pageSize, (pageSize) => {
  pagination.value = applyPageSize(pagination.value, pageSize)
})

watch(totalCount, (total) => {
  const pageSize = pagination.value.pageSize
  const maxPageIndex = total > 0 ? Math.max(0, Math.ceil(total / pageSize) - 1) : 0
  if (pagination.value.pageIndex > maxPageIndex) {
    pagination.value = { ...pagination.value, pageIndex: maxPageIndex }
  }
})
onMounted(() => { void loadRows() })
onBeforeUnmount(() => {
  debouncedRemoteLoad.cancel()
  activeController?.abort()
})
</script>

<template>
  <section class="gp-data-table-pattern" :aria-label="resolvedAriaLabel">
    <div class="gp-data-table-pattern__toolbar">
      <UInput v-model="search" type="search" :placeholder="t('patterns.datatable.search')" :aria-label="t('patterns.datatable.searchLabel')" class="gp-data-table-pattern__search" />
      <USelect v-for="filter in filters" :key="filter.key" v-model="filterValues[filter.key]" :items="[{ label: t('patterns.datatable.all'), value: ALL_FILTER_VALUE }, ...filter.options]" :aria-label="filter.label" />
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
      :empty="resolvedEmptyMessage"
      :server-side="isRemote"
      :retryable="isRemote"
      :pagination-label="t('patterns.datatable.pagination', { label: resolvedAriaLabel })"
      @query="onQuery"
      @retry="debouncedRemoteLoad.cancel(); loadRows()"
    />
  </section>
</template>
