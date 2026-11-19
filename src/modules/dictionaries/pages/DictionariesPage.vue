<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import UButton from '@nuxt/ui/runtime/components/Button.vue'
import { z } from 'zod'
import ComplexFormPattern, { type ComplexFormField } from '../../../components/patterns/ComplexFormPattern.vue'
import type { AdminStatus, DictionaryEntry, DictionaryType } from '../../../types/admin'
import {
  createDictionaryEntry,
  createDictionaryType,
  listDictionaryEntries,
  listDictionaryTypes,
  refreshDictionaryCache,
  setDefaultDictionaryEntry,
  updateDictionaryEntry,
  updateDictionaryEntryStatus,
  updateDictionaryType,
  updateDictionaryTypeStatus,
} from '../../../api/dictionaries'
import { formatApiError } from '../../../services/http'
import { createDebouncedTask } from '../../../utils/debounce'
import {
  canDeactivateDictionaryEntry,
  canDeactivateDictionaryType,
  normalizeDictionaryCode,
  validateDictionaryDefaultState,
} from '../model'

const { t, locale } = useI18n()

function formatDate(value: string | null): string {
  if (!value) return t('page.dictionaries.neverRefreshed')
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function idempotencyKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID?.() ?? Date.now()}`
}

const types = ref<DictionaryType[]>([])
const entries = ref<DictionaryEntry[]>([])
const selectedTypeId = ref('')
const search = ref('')
const statusFilter = ref<AdminStatus | 'all'>('all')
const feedback = ref('')
const error = ref('')
const listError = ref('')
const entriesError = ref('')
const loading = ref(false)
const entriesLoading = ref(false)
const lastRefresh = ref<string | null>(null)
let typeController: AbortController | null = null
let entryController: AbortController | null = null
const debouncedReload = createDebouncedTask(() => { void loadTypes() })

const typeModalOpen = ref(false)
const typeFormMode = ref<'create' | 'edit'>('create')
const typeInitialState = ref<Record<string, unknown>>({})
const entryModalOpen = ref(false)
const entryFormMode = ref<'create' | 'edit'>('create')
const entryInitialState = ref<Record<string, unknown>>({})
const editingEntryId = ref<string | null>(null)

const statusOptions = computed(() => [
  { label: t('page.dictionaries.allStatuses'), value: 'all' },
  { label: t('page.dictionaries.active'), value: 'active' },
  { label: t('page.dictionaries.inactive'), value: 'inactive' },
])
const formStatusOptions = computed(() => statusOptions.value.slice(1))
const defaultOptions = computed(() => [
  { label: t('page.dictionaries.yes'), value: 'yes' },
  { label: t('page.dictionaries.no'), value: 'no' },
])
const filteredTypes = computed(() => types.value)
const selectedType = computed(() => types.value.find((type) => type.id === selectedTypeId.value) ?? null)
const currentEntries = computed(() => entries.value)

async function loadTypes() {
  typeController?.abort()
  const controller = new AbortController()
  typeController = controller
  loading.value = true
  listError.value = ''
  const result = await listDictionaryTypes({
    page: 1,
    perPage: 100,
    search: search.value.trim() || undefined,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
  }, { signal: controller.signal })
  if (controller.signal.aborted) return
  loading.value = false
  if (!result.ok) {
    listError.value = formatApiError(result.error, t('page.dictionaries.loadFailed'))
    types.value = []
    entries.value = []
    selectedTypeId.value = ''
    return
  }
  types.value = result.data.items
  if (!types.value.some((type) => type.id === selectedTypeId.value)) selectedTypeId.value = types.value[0]?.id ?? ''
}

async function loadEntries() {
  if (!selectedTypeId.value) {
    entries.value = []
    return
  }
  entryController?.abort()
  const controller = new AbortController()
  entryController = controller
  entriesLoading.value = true
  entriesError.value = ''
  const result = await listDictionaryEntries(selectedTypeId.value, { signal: controller.signal })
  if (controller.signal.aborted) return
  entriesLoading.value = false
  if (!result.ok) {
    entriesError.value = formatApiError(result.error, t('page.dictionaries.entriesLoadFailed'))
    entries.value = []
    return
  }
  entries.value = result.data.items.sort((left, right) => left.sort_order - right.sort_order || left.code.localeCompare(right.code))
}

onMounted(() => { void loadTypes() })
watch(selectedTypeId, () => { void loadEntries() })
watch([search, statusFilter], () => { debouncedReload.schedule(250) })
onBeforeUnmount(() => {
  debouncedReload.cancel()
  typeController?.abort()
  entryController?.abort()
})

function entryCount(typeId: string): number {
  return types.value.find((type) => type.id === typeId)?.entry_count ?? 0
}

function selectType(typeId: string) {
  selectedTypeId.value = typeId
  feedback.value = ''
  error.value = ''
}

const typeSchema = computed(() => z.object({
  ...(typeFormMode.value === 'create' ? { code: z.string().trim().regex(/^[a-z][a-z0-9_]{2,63}$/) } : {}),
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500),
}))
const typeFields = computed<ComplexFormField[]>(() => [
  ...(typeFormMode.value === 'create' ? [{ name: 'code', label: t('page.dictionaries.form.typeCode'), required: true, placeholder: 'task_status' }] : []),
  { name: 'name', label: t('page.dictionaries.form.typeName'), required: true },
  { name: 'description', label: t('page.dictionaries.form.description') },
])

function openTypeCreate() {
  typeFormMode.value = 'create'
  typeInitialState.value = { code: '', name: '', description: '' }
  typeModalOpen.value = true
}

function openTypeEdit() {
  if (!selectedType.value) return
  typeFormMode.value = 'edit'
  typeInitialState.value = { code: selectedType.value.code, name: selectedType.value.name, description: selectedType.value.description }
  typeModalOpen.value = true
}

function replaceType(updated: DictionaryType) {
  types.value = types.value.map((type) => type.id === updated.id ? updated : type)
}

async function saveType(state: Record<string, unknown>) {
  const name = String(state.name).trim()
  const description = String(state.description ?? '').trim()
  if (typeFormMode.value === 'create') {
    const code = normalizeDictionaryCode(String(state.code))
    if (types.value.some((type) => type.code === code)) throw new Error(t('page.dictionaries.errors.duplicateTypeCode'))
    const result = await createDictionaryType({ code, name, description }, idempotencyKey('dictionary-type-create'))
    if (!result.ok) throw new Error(formatApiError(result.error, t('page.dictionaries.saveFailed')))
    types.value = [result.data, ...types.value]
    selectedTypeId.value = result.data.id
    feedback.value = t('page.dictionaries.success.typeCreated', { name })
  } else if (selectedType.value) {
    const result = await updateDictionaryType(selectedType.value.id, { name, description }, { version: selectedType.value.version })
    if (!result.ok) throw new Error(formatApiError(result.error, t('page.dictionaries.saveFailed')))
    replaceType(result.data)
    feedback.value = t('page.dictionaries.success.typeUpdated', { name: result.data.name })
  }
  typeModalOpen.value = false
}

async function toggleTypeStatus() {
  if (!selectedType.value) return
  error.value = ''
  if (selectedType.value.status === 'active') {
    const result = canDeactivateDictionaryType(entries.value, selectedType.value.id)
    if (!result.ok) {
      error.value = t(`page.dictionaries.errors.${result.reason}`)
      return
    }
  }
  const nextStatus = selectedType.value.status === 'active' ? 'inactive' : 'active'
  const result = await updateDictionaryTypeStatus(selectedType.value.id, { status: nextStatus }, {
    version: selectedType.value.version,
    idempotencyKey: idempotencyKey('dictionary-type-status'),
  })
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.dictionaries.saveFailed'))
    return
  }
  replaceType(result.data)
  feedback.value = t(result.data.status === 'active' ? 'page.dictionaries.success.typeActivated' : 'page.dictionaries.success.typeDeactivated', { name: result.data.name })
}

async function refreshCache() {
  if (!selectedType.value) return
  const result = await refreshDictionaryCache(selectedType.value.id, idempotencyKey('dictionary-cache'))
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.dictionaries.cacheRefreshFailed'))
    return
  }
  lastRefresh.value = result.data.refreshed_at
  feedback.value = t('page.dictionaries.success.cacheRefreshed')
}

const entrySchema = computed(() => z.object({
  ...(entryFormMode.value === 'create' ? { code: z.string().trim().regex(/^[a-z][a-z0-9_]{1,63}$/) } : {}),
  name: z.string().trim().min(1).max(100),
  sortOrder: z.coerce.number().int().min(0).max(1_000_000),
  defaultValue: z.enum(['yes', 'no']),
  ...(entryFormMode.value === 'edit' ? { status: z.enum(['active', 'inactive']) } : {}),
  description: z.string().max(500),
}))
const entryFields = computed<ComplexFormField[]>(() => {
  const fields: ComplexFormField[] = []
  if (entryFormMode.value === 'create') fields.push({ name: 'code', label: t('page.dictionaries.form.entryCode'), required: true })
  fields.push(
    { name: 'name', label: t('page.dictionaries.form.entryName'), required: true },
    { name: 'sortOrder', label: t('page.dictionaries.form.sortOrder'), required: true },
    { name: 'defaultValue', label: t('page.dictionaries.form.defaultValue'), type: 'select', required: true, options: defaultOptions.value },
  )
  if (entryFormMode.value === 'edit') fields.push({ name: 'status', label: t('page.dictionaries.form.status'), type: 'select', required: true, options: formStatusOptions.value })
  fields.push({ name: 'description', label: t('page.dictionaries.form.description') })
  return fields
})

function openEntryCreate() {
  if (!selectedType.value) return
  const nextSort = currentEntries.value.length ? Math.max(...currentEntries.value.map((entry) => entry.sort_order)) + 10 : 10
  entryFormMode.value = 'create'
  editingEntryId.value = null
  entryInitialState.value = { code: '', name: '', sortOrder: nextSort, defaultValue: 'no', status: 'active', description: '' }
  entryModalOpen.value = true
}

function openEntryEdit(entry: DictionaryEntry) {
  entryFormMode.value = 'edit'
  editingEntryId.value = entry.id
  entryInitialState.value = {
    code: entry.code,
    name: entry.name,
    sortOrder: entry.sort_order,
    defaultValue: entry.is_default ? 'yes' : 'no',
    status: entry.status,
    description: entry.description,
  }
  entryModalOpen.value = true
}

async function saveEntry(state: Record<string, unknown>) {
  if (!selectedType.value) return
  const name = String(state.name).trim()
  const isDefault = state.defaultValue === 'yes'
  const status = state.status as AdminStatus
  const defaultState = validateDictionaryDefaultState(status, isDefault)
  if (!defaultState.ok) throw new Error(t(`page.dictionaries.errors.${defaultState.reason}`))
  if (entryFormMode.value === 'create') {
    const code = normalizeDictionaryCode(String(state.code))
    if (currentEntries.value.some((entry) => entry.code === code)) throw new Error(t('page.dictionaries.errors.duplicateEntryCode'))
    const result = await createDictionaryEntry(selectedType.value.id, {
      code,
      name,
      sort_order: Number(state.sortOrder),
      is_default: isDefault,
      description: String(state.description ?? '').trim(),
    }, idempotencyKey('dictionary-entry-create'))
    if (!result.ok) throw new Error(formatApiError(result.error, t('page.dictionaries.saveFailed')))
    entries.value = [...entries.value, result.data]
    feedback.value = t('page.dictionaries.success.entryCreated', { name })
  } else {
    const entry = entries.value.find((candidate) => candidate.id === editingEntryId.value)
    if (!entry) throw new Error(t('page.dictionaries.errors.entryNotFound'))
    if (entry.is_default && status === 'inactive') {
      const deactivation = canDeactivateDictionaryEntry(entry, currentEntries.value)
      if (!deactivation.ok) throw new Error(t(`page.dictionaries.errors.${deactivation.reason}`))
    }
    const result = await updateDictionaryEntry(entry.id, {
      name,
      sort_order: Number(state.sortOrder),
      is_default: isDefault,
      description: String(state.description ?? '').trim(),
    }, { version: entry.version })
    if (!result.ok) throw new Error(formatApiError(result.error, t('page.dictionaries.saveFailed')))
    let updated = result.data
    if (status !== result.data.status) {
      const statusResult = await updateDictionaryEntryStatus(result.data.id, { status }, {
        version: result.data.version,
        idempotencyKey: idempotencyKey('dictionary-entry-status'),
      })
      if (!statusResult.ok) throw new Error(formatApiError(statusResult.error, t('page.dictionaries.saveFailed')))
      updated = statusResult.data
    }
    entries.value = entries.value.map((candidate) => candidate.id === updated.id ? updated : candidate)
    feedback.value = t('page.dictionaries.success.entryUpdated', { name })
  }
  await Promise.all([loadEntries(), loadTypes()])
  entryModalOpen.value = false
}

async function setDefaultEntry(entry: DictionaryEntry) {
  if (!selectedType.value) return
  if (entry.status !== 'active') {
    error.value = t('page.dictionaries.errors.entryInactive')
    return
  }
  const result = await setDefaultDictionaryEntry(selectedType.value.id, { entryId: entry.id }, {
    version: selectedType.value.version,
    idempotencyKey: idempotencyKey('dictionary-default'),
  })
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.dictionaries.saveFailed'))
    return
  }
  await Promise.all([loadEntries(), loadTypes()])
  feedback.value = t('page.dictionaries.success.defaultUpdated', { name: result.data.name })
}

async function toggleEntryStatus(entry: DictionaryEntry) {
  error.value = ''
  if (entry.status === 'active') {
    const result = canDeactivateDictionaryEntry(entry, currentEntries.value)
    if (!result.ok) {
      error.value = t(`page.dictionaries.errors.${result.reason}`)
      return
    }
  }
  const nextStatus = entry.status === 'active' ? 'inactive' : 'active'
  const result = await updateDictionaryEntryStatus(entry.id, { status: nextStatus }, {
    version: entry.version,
    idempotencyKey: idempotencyKey('dictionary-entry-status'),
  })
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.dictionaries.saveFailed'))
    return
  }
  await Promise.all([loadEntries(), loadTypes()])
  feedback.value = t(result.data.status === 'active' ? 'page.dictionaries.success.entryActivated' : 'page.dictionaries.success.entryDeactivated', { name: result.data.name })
}

const entryColumns = computed<TableColumn<DictionaryEntry>[]>(() => [
  { accessorKey: 'code', header: t('page.dictionaries.columnCode') },
  { accessorKey: 'name', header: t('page.dictionaries.columnName') },
  { accessorKey: 'sort_order', header: t('page.dictionaries.columnSort') },
  { id: 'default', header: t('page.dictionaries.columnDefault'), cell: ({ row }) => row.original.is_default ? h('span', { class: 'gp-badge gp-badge--success' }, t('page.dictionaries.defaultBadge')) : '—' },
  { accessorKey: 'status', header: t('page.dictionaries.columnStatus'), cell: ({ row }) => h('span', { class: ['gp-badge', row.original.status === 'active' ? 'gp-badge--success' : 'gp-badge--warning'] }, t(`page.dictionaries.${row.original.status}`)) },
  { accessorKey: 'updated_at', header: t('page.dictionaries.columnUpdated'), cell: ({ row }) => formatDate(row.original.updated_at) },
  {
    id: 'actions', header: t('page.dictionaries.columnActions'), enableSorting: false,
    cell: ({ row }) => h('div', { class: 'dictionary-entry-actions' }, [
      h(UButton, { size: 'xs', color: 'neutral', variant: 'ghost', 'aria-label': `${t('page.dictionaries.editEntry')} ${row.original.name}`, onClick: () => openEntryEdit(row.original) }, () => t('page.dictionaries.editEntry')),
      h(UButton, { size: 'xs', color: 'neutral', variant: 'ghost', disabled: row.original.is_default || row.original.status === 'inactive', 'aria-label': `${t('page.dictionaries.setDefault')} ${row.original.name}`, onClick: () => setDefaultEntry(row.original) }, () => t('page.dictionaries.setDefault')),
      h(UButton, { size: 'xs', color: row.original.status === 'active' ? 'error' : 'primary', variant: 'ghost', 'aria-label': `${row.original.status === 'active' ? t('page.dictionaries.deactivateEntry') : t('page.dictionaries.activateEntry')} ${row.original.name}`, onClick: () => toggleEntryStatus(row.original) }, () => row.original.status === 'active' ? t('page.dictionaries.deactivateEntry') : t('page.dictionaries.activateEntry')),
    ]),
  },
])
</script>

<template>
  <section class="gp-page" data-testid="production-dictionaries">
    <header class="gp-page-header">
      <div>
        <p class="gp-secondary">{{ t('nav.configuration') }}</p>
        <h1 class="gp-page-title">{{ t('page.dictionaries.title') }}</h1>
        <p class="gp-secondary">{{ t('page.dictionaries.subtitle') }}</p>
      </div>
      <UButton data-testid="dictionary-type-create" icon="i-lucide-plus" @click="openTypeCreate">{{ t('page.dictionaries.createType') }}</UButton>
    </header>

    <p v-if="feedback" class="gp-card dictionary-feedback" role="status" aria-live="polite" data-testid="dictionary-feedback">{{ feedback }}</p>
    <p v-if="error" class="gp-card dictionary-error" role="alert" data-testid="dictionary-error">{{ error }}</p>
    <p v-if="listError" class="gp-card dictionary-error" role="alert" data-testid="dictionary-list-error">{{ listError }}</p>

    <div class="dictionary-layout">
      <section class="gp-card dictionary-types" :aria-label="t('page.dictionaries.typeListTitle')">
        <div class="dictionary-panel-heading">
          <div>
            <h2 class="gp-card-title">{{ t('page.dictionaries.typeListTitle') }}</h2>
            <p class="gp-secondary">{{ t('page.dictionaries.typeCount', { count: filteredTypes.length }) }}</p>
          </div>
          <span class="gp-badge gp-badge--success">{{ t('page.dictionaries.serverData') }}</span>
        </div>
        <div class="dictionary-toolbar" role="search" :aria-label="t('page.dictionaries.filtersLabel')">
          <UInput v-model="search" type="search" :placeholder="t('page.dictionaries.searchPlaceholder')" :aria-label="t('page.dictionaries.search')" data-testid="dictionary-search" />
          <USelect v-model="statusFilter" :items="statusOptions" :aria-label="t('page.dictionaries.statusFilter')" />
        </div>
        <p v-if="loading" class="dictionary-empty" role="status">{{ t('page.dictionaries.loading') }}</p>
        <p v-else-if="filteredTypes.length === 0" class="dictionary-empty" role="status">{{ t('page.dictionaries.filterEmpty') }}</p>
        <ul v-else class="dictionary-type-list">
          <li v-for="type in filteredTypes" :key="type.id">
            <button type="button" class="dictionary-type-item" :class="{ 'dictionary-type-item--selected': selectedTypeId === type.id }" :aria-pressed="selectedTypeId === type.id" :data-testid="`dictionary-type-${type.id}`" @click="selectType(type.id)">
              <span class="dictionary-type-item__heading">
                <strong>{{ type.name }}</strong>
                <span class="gp-badge" :class="type.status === 'active' ? 'gp-badge--success' : 'gp-badge--warning'">{{ t(`page.dictionaries.${type.status}`) }}</span>
              </span>
              <span class="gp-secondary">{{ type.code }} · {{ t('page.dictionaries.entryCount', { count: entryCount(type.id) }) }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section v-if="selectedType" class="gp-card dictionary-detail" :aria-label="t('page.dictionaries.detailTitle')">
        <div class="dictionary-detail-heading">
          <div>
            <p class="gp-secondary">{{ selectedType.code }} · v{{ selectedType.version }}</p>
            <h2 class="gp-card-title">{{ selectedType.name }}</h2>
            <p class="gp-secondary">{{ selectedType.description || t('page.dictionaries.noDescription') }}</p>
          </div>
          <span class="gp-badge" :class="selectedType.status === 'active' ? 'gp-badge--success' : 'gp-badge--warning'">{{ t(`page.dictionaries.${selectedType.status}`) }}</span>
        </div>

        <div class="dictionary-meta">
          <span>{{ t('page.dictionaries.updatedAt') }}: {{ formatDate(selectedType.updated_at) }}</span>
          <span>{{ t('page.dictionaries.cacheUpdated') }}: {{ formatDate(lastRefresh) }}</span>
        </div>

        <div class="dictionary-actions">
          <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-pencil" data-testid="dictionary-type-edit" @click="openTypeEdit">{{ t('page.dictionaries.editType') }}</UButton>
          <UButton size="sm" :color="selectedType.status === 'active' ? 'error' : 'primary'" variant="outline" data-testid="dictionary-type-status" @click="toggleTypeStatus">{{ selectedType.status === 'active' ? t('page.dictionaries.deactivateType') : t('page.dictionaries.activateType') }}</UButton>
          <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-refresh-cw" data-testid="dictionary-refresh-cache" @click="refreshCache">{{ t('page.dictionaries.refreshCache') }}</UButton>
          <UButton size="sm" icon="i-lucide-plus" data-testid="dictionary-entry-create" @click="openEntryCreate">{{ t('page.dictionaries.createEntry') }}</UButton>
        </div>

        <p v-if="entriesError" class="gp-card dictionary-error" role="alert" data-testid="dictionary-entries-error">{{ entriesError }}</p>
        <UDataTable :data="currentEntries" :columns="entryColumns" :loading="entriesLoading" :empty="t('page.dictionaries.entriesEmpty')" :pagination-label="t('page.dictionaries.entriesPagination')" :page-size="5" />

        <div class="dictionary-boundary">
          <strong>{{ t('page.dictionaries.boundaryTitle') }}</strong>
          <p>{{ t('page.dictionaries.boundaryBody') }}</p>
        </div>
      </section>
    </div>

    <UModal v-model:open="typeModalOpen" :title="typeFormMode === 'create' ? t('page.dictionaries.createTypeTitle') : t('page.dictionaries.editTypeTitle')" :description="t('page.dictionaries.typeFormDescription')">
      <template #body>
        <ComplexFormPattern :schema="typeSchema" :initial-state="typeInitialState" :fields="typeFields" :submit-label="typeFormMode === 'create' ? t('page.dictionaries.createTypeSubmit') : t('page.dictionaries.saveTypeSubmit')" :submitter="saveType" @success="typeModalOpen = false" />
      </template>
    </UModal>

    <UModal v-model:open="entryModalOpen" :title="entryFormMode === 'create' ? t('page.dictionaries.createEntryTitle') : t('page.dictionaries.editEntryTitle')" :description="t('page.dictionaries.entryFormDescription')">
      <template #body>
        <ComplexFormPattern :schema="entrySchema" :initial-state="entryInitialState" :fields="entryFields" :submit-label="entryFormMode === 'create' ? t('page.dictionaries.createEntrySubmit') : t('page.dictionaries.saveEntrySubmit')" :submitter="saveEntry" @success="entryModalOpen = false" />
      </template>
    </UModal>
  </section>
</template>

<style scoped>
.dictionary-feedback { border-color: var(--gp-success-fg); }
.dictionary-error { border-color: var(--gp-danger-bg); color: var(--gp-danger-fg); }
.dictionary-layout { display: grid; grid-template-columns: minmax(240px, .8fr) minmax(0, 1.9fr); gap: var(--gp-section-gap); align-items: start; }
.dictionary-panel-heading, .dictionary-detail-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--gp-space-3); }
.dictionary-toolbar { display: grid; gap: var(--gp-space-2); margin-top: var(--gp-space-3); }
.dictionary-type-list { list-style: none; display: grid; gap: var(--gp-space-2); padding: 0; margin: var(--gp-space-3) 0 0; }
.dictionary-type-item { inline-size: 100%; display: grid; gap: var(--gp-space-1); text-align: start; border: 1px solid var(--gp-border-default); border-radius: var(--gp-radius-control); padding: var(--gp-space-3); background: var(--gp-surface-default); color: inherit; cursor: pointer; }
.dictionary-type-item:hover, .dictionary-type-item--selected { background: var(--gp-primary-subtle); border-color: var(--gp-primary); }
.dictionary-type-item:focus-visible { outline: 2px solid var(--gp-primary-focus); outline-offset: 2px; }
.dictionary-type-item__heading { display: flex; align-items: center; justify-content: space-between; gap: var(--gp-space-2); }
.dictionary-empty { padding: var(--gp-space-6); text-align: center; color: var(--gp-text-secondary); }
.dictionary-detail { display: grid; gap: var(--gp-space-4); min-width: 0; }
.dictionary-meta { display: flex; flex-wrap: wrap; gap: var(--gp-space-3); color: var(--gp-text-secondary); font-size: var(--gp-type-body-small-size); }
.dictionary-actions { display: flex; flex-wrap: wrap; gap: var(--gp-space-2); }
.dictionary-entry-actions { display: flex; flex-wrap: wrap; gap: 2px; }
.dictionary-boundary { padding: var(--gp-space-3); border-radius: var(--gp-radius-control); background: var(--gp-page-bg); color: var(--gp-text-secondary); }
.dictionary-boundary strong { color: var(--gp-text-primary); }
.dictionary-boundary p { margin: var(--gp-space-1) 0 0; }
@media (max-width: 959px) { .dictionary-layout { grid-template-columns: 1fr; } }
</style>
