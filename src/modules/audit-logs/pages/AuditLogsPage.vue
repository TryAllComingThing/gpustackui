<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import DataTablePattern, { type DataTableQuery } from '../../../components/patterns/DataTablePattern.vue'
import type { AuditActionDefinition, AuditEvent, AuditResult } from '../../../types/admin'
import { listAuditActions, listAuditEvents } from '../../../api/audit-logs'
import { formatApiError } from '../../../services/http'
import { auditEventHref } from '../model'

const { t, locale } = useI18n()
const router = useRouter()
type AuditEventRow = AuditEvent & { id: string }

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value))
}

const dateFrom = ref('')
const dateTo = ref('')
const rows = ref<AuditEventRow[]>([])
const total = ref(0)
const actions = ref<AuditActionDefinition[]>([])
const loadError = ref('')
const refreshToken = ref(0)
let actionController: AbortController | null = null

async function loadActionDefinitions() {
  actionController?.abort()
  const controller = new AbortController()
  actionController = controller
  loadError.value = ''
  const result = await listAuditActions({ signal: controller.signal })
  if (controller.signal.aborted) return
  if (!result.ok) {
    loadError.value = formatApiError(result.error, t('page.auditLogs.actionsLoadFailed'))
    return
  }
  actions.value = result.data.items
}

async function loadAuditEvents(query: DataTableQuery, signal?: AbortSignal) {
  const resultValue = query.filters.result
  const resultFilter: AuditResult | undefined = resultValue === 'success' || resultValue === 'failure' ? resultValue : undefined
  const result = await listAuditEvents({
    page: query.pagination.pageIndex + 1,
    perPage: query.pagination.pageSize,
    search: query.search.trim() || undefined,
    action: query.filters.action || undefined,
    result: resultFilter,
    occurredFrom: dateFrom.value ? `${dateFrom.value}T00:00:00Z` : undefined,
    occurredTo: dateTo.value ? `${dateTo.value}T23:59:59Z` : undefined,
  }, { signal })
  if (!result.ok) throw new Error(formatApiError(result.error, t('page.auditLogs.loadFailed')))
  rows.value = result.data.items.map((event) => ({ ...event, id: event.event_id }))
  total.value = result.data.pagination.total
  return { data: rows.value, total: total.value }
}

onMounted(() => { void loadActionDefinitions() })
watch([dateFrom, dateTo], () => { refreshToken.value += 1 })
onBeforeUnmount(() => { actionController?.abort() })
const filters = computed(() => [
  {
    key: 'result',
    label: t('page.auditLogs.resultFilter'),
    options: [
      { label: t('page.auditLogs.success'), value: 'success' },
      { label: t('page.auditLogs.failure'), value: 'failure' },
    ],
  },
  {
    key: 'action',
    label: t('page.auditLogs.actionFilter'),
    options: actions.value.map((definition) => ({
      label: definition.labelKey.startsWith('page.') ? t(definition.labelKey) : t(`page.auditLogs.actions.${definition.labelKey}`),
      value: definition.value,
    })),
  },
])
const columns = computed<TableColumn<AuditEventRow>[]>(() => [
  { accessorKey: 'occurred_at', header: t('page.auditLogs.columnTime'), cell: ({ row }) => formatDate(row.original.occurred_at) },
  { accessorKey: 'actor_name', header: t('page.auditLogs.columnActor') },
  { accessorKey: 'action', header: t('page.auditLogs.columnAction') },
  { id: 'resource', header: t('page.auditLogs.columnResource'), cell: ({ row }) => `${row.original.resource_type} · ${row.original.resource_name}` },
  { accessorKey: 'result', header: t('page.auditLogs.columnResult'), cell: ({ row }) => h('span', { class: ['gp-badge', row.original.result === 'success' ? 'gp-badge--success' : 'gp-badge--danger'] }, t(`page.auditLogs.${row.original.result}`)) },
  { accessorKey: 'request_id', header: t('page.auditLogs.columnRequestId'), cell: ({ row }) => h('code', row.original.request_id) },
])
const rowActions = (event: AuditEventRow) => [
  {
    label: t('page.auditLogs.viewDetail'),
    icon: 'i-lucide-external-link',
    onSelect: () => { void router.push(auditEventHref(event.event_id)) },
  },
]
</script>

<template>
  <section class="gp-page" data-testid="production-audit-logs">
    <header class="gp-page-header">
      <div>
        <p class="gp-secondary">{{ t('nav.security') }}</p>
        <h1 class="gp-page-title">{{ t('page.auditLogs.title') }}</h1>
        <p class="gp-secondary">{{ t('page.auditLogs.subtitle') }}</p>
      </div>
    </header>

    <p v-if="loadError" class="gp-card audit-error" role="alert" data-testid="audit-load-error">{{ loadError }}</p>

    <div class="gp-card audit-boundary" role="note" data-testid="audit-readonly-notice">
      <strong>{{ t('page.auditLogs.boundaryTitle') }}</strong>
      <p>{{ t('page.auditLogs.boundaryBody') }}</p>
    </div>

    <div class="gp-card audit-date-filter" role="search" :aria-label="t('page.auditLogs.dateFilter')">
      <label>
        <span class="gp-secondary">{{ t('page.auditLogs.dateFrom') }}</span>
        <input v-model="dateFrom" type="date" class="gp-app-select" :aria-label="t('page.auditLogs.dateFrom')" data-testid="audit-date-from" />
      </label>
      <label>
        <span class="gp-secondary">{{ t('page.auditLogs.dateTo') }}</span>
        <input v-model="dateTo" type="date" class="gp-app-select" :aria-label="t('page.auditLogs.dateTo')" data-testid="audit-date-to" />
      </label>
      <span class="gp-secondary">{{ t('page.auditLogs.resultCount', { count: total }) }}</span>
    </div>

    <div class="gp-card">
      <DataTablePattern
        :rows="rows"
        :columns="columns"
        :load="loadAuditEvents"
        :refresh-token="refreshToken"
        :search-keys="['actor_name', 'action', 'resource_name', 'request_id']"
        :filters="filters"
        :row-actions="rowActions"
        :empty-message="t('page.auditLogs.empty')"
        :aria-label="t('page.auditLogs.tableLabel')"
        :page-size="8"
      />
    </div>
  </section>
</template>

<style scoped>
.audit-boundary { display: grid; gap: var(--gp-space-1); }
.audit-error { border-color: var(--gp-danger-bg); color: var(--gp-danger-fg); }
.audit-boundary p { margin: 0; color: var(--gp-text-secondary); }
.audit-date-filter { display: flex; flex-wrap: wrap; align-items: end; gap: var(--gp-space-3); }
.audit-date-filter label { display: grid; gap: var(--gp-space-1); }
.audit-date-filter > :last-child { margin-inline-start: auto; }
@media (max-width: 639px) { .audit-date-filter > * { inline-size: 100%; } .audit-date-filter > :last-child { margin-inline-start: 0; } }
</style>
