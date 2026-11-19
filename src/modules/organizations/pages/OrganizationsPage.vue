<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { z } from 'zod'
import {
  changeOrganizationStatus as changeOrganizationStatusRequest,
  createOrganization as createOrganizationRequest,
  getOrganizationTree,
  moveOrganization as moveOrganizationRequest,
  updateOrganization as updateOrganizationRequest,
  type Organization,
  type OrganizationStatus,
  type OrganizationType,
} from '../../../api/organizations'
import ComplexFormPattern, { type ComplexFormField } from '../../../components/patterns/ComplexFormPattern.vue'
import { formatApiError, type ApiError } from '../../../services/http'
import {
  buildOrganizationTree,
  canChangeOrganizationStatus,
  canMoveOrganization,
  flattenOrganizationNodes,
  flattenOrganizationTree,
  getDescendantIds,
  getOrganization,
  getOrganizationPath,
  ORGANIZATION_MAX_DEPTH,
  type VisibleOrganizationRow,
} from '../model'

const { t, locale } = useI18n()

function text(value: unknown): string {
  return String(value ?? '').trim()
}

function idempotencyKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID?.() ?? Date.now()}`
}

function withRequestId(message: string, error: ApiError): string {
  return error.requestId ? `${message} (request_id: ${error.requestId})` : message
}

function organizationErrorMessage(error: ApiError, fallback: string): string {
  let mapped = ''
  switch (error.serverCode) {
    case 'ORG_NOT_FOUND':
    case 'ORG_PARENT_NOT_FOUND':
    case 'ORG_LEADER_NOT_FOUND':
      mapped = t('page.organizations.errors.notFound')
      break
    case 'ORG_CODE_CONFLICT':
      mapped = t('page.organizations.errors.duplicateCode')
      break
    case 'ORG_PARENT_INACTIVE':
      mapped = t('page.organizations.errors.parentInactive')
      break
    case 'ORG_CYCLE':
      mapped = t('page.organizations.errors.cycle')
      break
    case 'ORG_MAX_DEPTH_EXCEEDED':
      mapped = t('page.organizations.errors.maxDepth')
      break
    case 'ORG_HAS_ACTIVE_CHILDREN':
      mapped = t('page.organizations.errors.activeChildren')
      break
    case 'ORG_ROOT_PROTECTED':
      mapped = t('page.organizations.errors.rootProtected')
      break
    case 'ORG_INVALID_STATE':
      mapped = t('page.organizations.errors.invalidState')
      break
    case 'ORG_VERSION_CONFLICT':
      mapped = t('page.organizations.errors.staleVersion')
      break
    case 'IDEMPOTENCY_KEY_REUSED':
    case 'IDEMPOTENCY_IN_PROGRESS':
      mapped = t('page.organizations.errors.idempotencyConflict')
      break
    case 'ORG_FORBIDDEN':
    case 'UNAUTHORIZED':
      mapped = t('page.organizations.errors.forbidden')
      break
  }
  if (!mapped) {
    if (error.code === 'PRECONDITION_FAILED') mapped = t('page.organizations.errors.staleVersion')
    else if (error.code === 'PRECONDITION_REQUIRED') mapped = t('page.organizations.errors.preconditionRequired')
    else if (error.code === 'FORBIDDEN' || error.code === 'UNAUTHORIZED') mapped = t('page.organizations.errors.forbidden')
  }
  return mapped ? withRequestId(mapped, error) : formatApiError(error, fallback)
}

const organizations = ref<Organization[]>([])
const selectedId = ref<string | null>(null)
const expandedIds = ref<Set<string>>(new Set())
const search = ref('')
const statusFilter = ref<OrganizationStatus | 'all'>('all')
const typeFilter = ref<OrganizationType | 'all'>('all')
const feedback = ref('')
const loading = ref(false)
const loadError = ref('')
let treeController: AbortController | null = null

interface LoadTreeOptions {
  selectId?: string | null
  expandId?: string
  initialize?: boolean
}

async function loadTree(options: LoadTreeOptions = {}): Promise<boolean> {
  treeController?.abort()
  const controller = new AbortController()
  treeController = controller
  loading.value = true
  loadError.value = ''
  const result = await getOrganizationTree({ includeInactive: true }, { signal: controller.signal })
  if (controller.signal.aborted) return false
  loading.value = false
  if (!result.ok) {
    loadError.value = organizationErrorMessage(result.error, t('page.organizations.loadFailed'))
    return false
  }

  const nextOrganizations = flattenOrganizationNodes(result.data.items)
  organizations.value = nextOrganizations
  if (options.initialize) {
    const parentIds = new Set(nextOrganizations
      .filter((organization) => nextOrganizations.some((candidate) => candidate.parent_id === organization.id))
      .filter((organization) => organization.depth < 3)
      .map((organization) => organization.id))
    expandedIds.value = parentIds
  }
  if (options.expandId) {
    const next = new Set(expandedIds.value)
    next.add(options.expandId)
    expandedIds.value = next
  }

  const requestedId = options.selectId !== undefined ? options.selectId : selectedId.value
  const fallbackId = nextOrganizations.find((organization) => !organization.parent_id)?.id
    ?? nextOrganizations[0]?.id
    ?? null
  selectedId.value = requestedId && nextOrganizations.some((organization) => organization.id === requestedId)
    ? requestedId
    : fallbackId
  return true
}

function replaceOrganization(updated: Organization) {
  const exists = organizations.value.some((organization) => organization.id === updated.id)
  organizations.value = exists
    ? organizations.value.map((organization) => organization.id === updated.id ? updated : organization)
    : [...organizations.value, updated]
}

function retryLoad() {
  void loadTree()
}

const tree = computed(() => buildOrganizationTree(organizations.value))
const visibleRows = computed(() => flattenOrganizationTree(tree.value, {
  expanded: expandedIds.value,
  search: search.value,
  status: statusFilter.value,
  type: typeFilter.value,
}))
const selected = computed(() => selectedId.value ? getOrganization(organizations.value, selectedId.value) ?? null : null)
const selectedPath = computed(() => selected.value ? getOrganizationPath(organizations.value, selected.value.id) : [])

const statusOptions = computed(() => [
  { label: t('page.organizations.allStatuses'), value: 'all' },
  { label: t('page.organizations.active'), value: 'active' },
  { label: t('page.organizations.inactive'), value: 'inactive' },
])
const typeOptions = computed(() => [
  { label: t('page.organizations.allTypes'), value: 'all' },
  { label: t('page.organizations.types.company'), value: 'company' },
  { label: t('page.organizations.types.department'), value: 'department' },
  { label: t('page.organizations.types.team'), value: 'team' },
  { label: t('page.organizations.types.other'), value: 'other' },
])
const formTypeOptions = computed(() => typeOptions.value.slice(1))

function statusLabel(status: OrganizationStatus): string {
  return t(`page.organizations.${status}`)
}

function typeLabel(type: OrganizationType): string {
  return t(`page.organizations.types.${type}`)
}

function statusTone(status: OrganizationStatus): string {
  return status === 'active' ? 'gp-badge--success' : 'gp-badge--warning'
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function setExpanded(organizationId: string, expanded: boolean) {
  const next = new Set(expandedIds.value)
  if (expanded) next.add(organizationId)
  else next.delete(organizationId)
  expandedIds.value = next
}

function toggleExpanded(organizationId: string) {
  setExpanded(organizationId, !expandedIds.value.has(organizationId))
}

function selectOrganization(organizationId: string) {
  selectedId.value = organizationId
}

const rowButtons = new Map<string, HTMLButtonElement>()

function setRowButton(organizationId: string, element: Element | null) {
  if (element instanceof HTMLButtonElement) rowButtons.set(organizationId, element)
  else rowButtons.delete(organizationId)
}

function focusVisibleRow(index: number) {
  const row = visibleRows.value[index]
  if (row) rowButtons.get(row.organization.id)?.focus()
}

function onTreeKeydown(event: KeyboardEvent, row: VisibleOrganizationRow, index: number) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusVisibleRow(Math.min(index + 1, visibleRows.value.length - 1))
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusVisibleRow(Math.max(index - 1, 0))
    return
  }
  if (event.key === 'Home') {
    event.preventDefault()
    focusVisibleRow(0)
    return
  }
  if (event.key === 'End') {
    event.preventDefault()
    focusVisibleRow(visibleRows.value.length - 1)
    return
  }
  if (event.key === 'ArrowRight' && row.hasChildren && !row.expanded) {
    event.preventDefault()
    setExpanded(row.organization.id, true)
    return
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    if (row.hasChildren && row.expanded) {
      setExpanded(row.organization.id, false)
      return
    }
    const parentIndex = visibleRows.value.findIndex((candidate) => candidate.organization.id === row.organization.parent_id)
    if (parentIndex >= 0) focusVisibleRow(parentIndex)
  }
}

const createOpen = ref(false)
const editOpen = ref(false)
const moveOpen = ref(false)
const statusOpen = ref(false)
const statusError = ref('')
const statusSubmitting = ref(false)
const createInitialState = ref<Record<string, unknown>>({})
const editInitialState = ref<Record<string, unknown>>({})
const moveInitialState = ref<Record<string, unknown>>({})

const sortOrderSchema = z.coerce.number().int().min(0).max(1_000_000)
const createSchema = computed(() => z.object({
  parentId: z.string().min(1),
  code: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(200),
  type: z.enum(['company', 'department', 'team', 'other']),
  sortOrder: sortOrderSchema,
  description: z.string().max(2000).optional(),
}))
const editSchema = computed(() => z.object({
  name: z.string().trim().min(1).max(200),
  type: z.enum(['company', 'department', 'team', 'other']),
  sortOrder: sortOrderSchema,
  description: z.string().max(2000).optional(),
}))
const moveSchema = computed(() => z.object({
  targetParentId: z.string().min(1),
  sortOrder: sortOrderSchema,
}))

const createFields = computed<ComplexFormField[]>(() => [
  { name: 'parentId', label: t('page.organizations.form.parent'), type: 'select', required: true, options: parentOptions.value },
  { name: 'code', label: t('page.organizations.form.code'), required: true },
  { name: 'name', label: t('page.organizations.form.name'), required: true },
  { name: 'type', label: t('page.organizations.form.type'), type: 'select', required: true, options: formTypeOptions.value },
  { name: 'sortOrder', label: t('page.organizations.form.sortOrder'), required: true },
  { name: 'description', label: t('page.organizations.form.description') },
])
const editFields = computed<ComplexFormField[]>(() => createFields.value.slice(2))
const moveFields = computed<ComplexFormField[]>(() => [
  { name: 'targetParentId', label: t('page.organizations.form.targetParent'), type: 'select', required: true, options: moveTargetOptions.value },
  { name: 'sortOrder', label: t('page.organizations.form.sortOrder'), required: true },
])

function activeParentOptions() {
  return organizations.value
    .filter((organization) => organization.status === 'active' && organization.depth < ORGANIZATION_MAX_DEPTH)
    .sort((left, right) => getOrganizationPath(organizations.value, left.id).length - getOrganizationPath(organizations.value, right.id).length)
    .map((organization) => ({ label: `${organization.name} · ${organization.code}`, value: organization.id }))
}

const parentOptions = computed(activeParentOptions)
const moveTargetOptions = computed(() => {
  if (!selected.value) return []
  const excluded = getDescendantIds(organizations.value, selected.value.id)
  excluded.add(selected.value.id)
  return organizations.value
    .filter((organization) => organization.status === 'active' && !excluded.has(organization.id))
    .map((organization) => ({ label: `${organization.name} · ${organization.code}`, value: organization.id }))
})

function nextSortOrder(parentId: string): number {
  const siblings = organizations.value.filter((organization) => organization.parent_id === parentId)
  return siblings.length ? Math.max(...siblings.map((organization) => organization.sort_order)) + 10 : 10
}

function openCreate(parentId?: string) {
  const fallbackParent = selected.value?.status === 'active' && selected.value.depth < ORGANIZATION_MAX_DEPTH
    ? selected.value
    : organizations.value.find((organization) => !organization.parent_id)
  const targetParentId = parentId ?? fallbackParent?.id
  if (!targetParentId) return
  createInitialState.value = {
    parentId: targetParentId,
    code: '',
    name: '',
    type: 'department',
    sortOrder: nextSortOrder(targetParentId),
    description: '',
  }
  createOpen.value = true
}

function openEdit() {
  if (!selected.value) return
  editInitialState.value = {
    name: selected.value.name,
    type: selected.value.type,
    sortOrder: selected.value.sort_order,
    description: selected.value.description ?? '',
  }
  editOpen.value = true
}

function openMove() {
  if (!selected.value?.parent_id) return
  if (moveTargetOptions.value.length === 0) return
  moveInitialState.value = {
    targetParentId: moveTargetOptions.value[0]?.value ?? '',
    sortOrder: selected.value.sort_order,
  }
  moveOpen.value = true
}

function openStatus() {
  if (!selected.value) return
  statusError.value = ''
  statusOpen.value = true
}

async function createOrganization(state: Record<string, unknown>) {
  const parent = getOrganization(organizations.value, text(state.parentId))
  if (!parent) throw new Error(t('page.organizations.errors.notFound'))
  if (parent.status !== 'active') throw new Error(t('page.organizations.errors.parentInactive'))
  if (parent.depth >= ORGANIZATION_MAX_DEPTH) throw new Error(t('page.organizations.errors.maxDepth'))
  const code = text(state.code)
  if (organizations.value.some((organization) => organization.code.toLowerCase() === code.toLowerCase())) {
    throw new Error(t('page.organizations.errors.duplicateCode'))
  }
  const result = await createOrganizationRequest({
    parentId: parent.id,
    code,
    name: text(state.name),
    type: state.type as OrganizationType,
    sortOrder: Number(state.sortOrder),
    description: text(state.description) || null,
  }, { idempotencyKey: idempotencyKey('organization-create') })
  if (!result.ok) throw new Error(organizationErrorMessage(result.error, t('page.organizations.saveFailed')))

  replaceOrganization(result.data)
  setExpanded(parent.id, true)
  selectedId.value = result.data.id
  await loadTree({ selectId: result.data.id })
  feedback.value = t('page.organizations.success.created', { name: result.data.name })
}

async function updateOrganization(state: Record<string, unknown>) {
  if (!selected.value) return
  const result = await updateOrganizationRequest(selected.value.id, {
    name: text(state.name),
    type: state.type as OrganizationType,
    sortOrder: Number(state.sortOrder),
    description: text(state.description) || null,
  }, { version: selected.value.version })
  if (!result.ok) throw new Error(organizationErrorMessage(result.error, t('page.organizations.saveFailed')))

  replaceOrganization(result.data)
  await loadTree({ selectId: result.data.id })
  feedback.value = t('page.organizations.success.updated', { name: result.data.name })
}

async function moveOrganization(state: Record<string, unknown>) {
  if (!selected.value) return
  const target = selected.value
  const targetParentId = text(state.targetParentId)
  const result = canMoveOrganization(organizations.value, target.id, targetParentId)
  if (!result.ok) throw new Error(t(`page.organizations.errors.${result.reason}`))

  const parent = getOrganization(organizations.value, targetParentId)
  if (!parent) throw new Error(t('page.organizations.errors.targetNotFound'))
  const response = await moveOrganizationRequest(target.id, {
    targetParentId,
    sortOrder: Number(state.sortOrder),
  }, { version: target.version, idempotencyKey: idempotencyKey('organization-move') })
  if (!response.ok) throw new Error(organizationErrorMessage(response.error, t('page.organizations.saveFailed')))

  replaceOrganization(response.data)
  setExpanded(parent.id, true)
  await loadTree({ selectId: response.data.id })
  feedback.value = t('page.organizations.success.moved', { name: response.data.name })
}

async function applyStatusChange() {
  if (!selected.value || statusSubmitting.value) return
  const target = selected.value
  const nextStatus: OrganizationStatus = target.status === 'active' ? 'inactive' : 'active'
  const result = canChangeOrganizationStatus(organizations.value, target.id, nextStatus)
  if (!result.ok) {
    statusError.value = t(`page.organizations.errors.${result.reason}`)
    return
  }

  statusSubmitting.value = true
  statusError.value = ''
  const response = await changeOrganizationStatusRequest(target.id, { status: nextStatus }, {
    version: target.version,
    idempotencyKey: idempotencyKey('organization-status'),
  })
  statusSubmitting.value = false
  if (!response.ok) {
    statusError.value = organizationErrorMessage(response.error, t('page.organizations.saveFailed'))
    return
  }

  replaceOrganization(response.data)
  statusOpen.value = false
  await loadTree({ selectId: response.data.id })
  feedback.value = t(nextStatus === 'active'
    ? 'page.organizations.success.activated'
    : 'page.organizations.success.deactivated', { name: response.data.name })
}

const nextStatusLabel = computed(() => selected.value?.status === 'active'
  ? t('page.organizations.deactivate')
  : t('page.organizations.activate'))
const statusDescription = computed(() => selected.value?.status === 'active'
  ? t('page.organizations.deactivateDescription')
  : t('page.organizations.activateDescription'))

onMounted(() => { void loadTree({ initialize: true }) })
onBeforeUnmount(() => { treeController?.abort() })
</script>

<template>
  <section class="gp-page" data-testid="production-organizations">
    <header class="gp-page-header">
      <div>
        <p class="gp-secondary">{{ t('nav.iam') }}</p>
        <h1 class="gp-page-title">{{ t('page.organizations.title') }}</h1>
        <p class="gp-secondary">{{ t('page.organizations.subtitle') }}</p>
        <p class="gp-secondary" data-testid="organization-data-source">{{ t('page.organizations.remoteData') }}</p>
      </div>
      <UButton data-testid="organization-create-open" icon="i-lucide-plus" :disabled="loading || Boolean(loadError) || organizations.length === 0" @click="openCreate()">
        {{ t('page.organizations.create') }}
      </UButton>
    </header>

    <p v-if="feedback" class="gp-card organization-feedback" role="status" aria-live="polite" data-testid="organization-feedback">{{ feedback }}</p>

    <div class="gp-card organization-toolbar" role="search" :aria-label="t('page.organizations.filtersLabel')">
      <UInput v-model="search" type="search" :placeholder="t('page.organizations.searchPlaceholder')" :aria-label="t('page.organizations.search')" data-testid="organization-search" />
      <USelect v-model="statusFilter" :items="statusOptions" :aria-label="t('page.organizations.statusFilter')" data-testid="organization-status-filter" />
      <USelect v-model="typeFilter" :items="typeOptions" :aria-label="t('page.organizations.typeFilter')" data-testid="organization-type-filter" />
      <span class="gp-secondary organization-keyboard-hint">{{ t('page.organizations.keyboardHint') }}</span>
    </div>

    <div class="organization-layout">
      <section class="gp-card organization-tree-panel" :aria-label="t('page.organizations.treeTitle')">
        <div class="organization-panel-heading">
          <div>
            <h2 class="gp-card-title">{{ t('page.organizations.treeTitle') }}</h2>
            <p class="gp-secondary">{{ t('page.organizations.treeCount', { count: visibleRows.length }) }}</p>
          </div>
          <span class="gp-badge gp-badge--success">{{ t('page.organizations.remoteData') }}</span>
        </div>

        <p v-if="loading && organizations.length === 0" class="organization-empty" role="status" data-testid="organization-loading">
          {{ t('page.organizations.loading') }}
        </p>
        <div v-else-if="loadError" class="organization-error" role="alert" data-testid="organization-load-error">
          <p>{{ loadError }}</p>
          <UButton size="sm" color="neutral" variant="outline" data-testid="organization-retry" @click="retryLoad">{{ t('page.organizations.retry') }}</UButton>
        </div>
        <p v-else-if="visibleRows.length === 0" class="organization-empty" role="status">
          {{ search || statusFilter !== 'all' || typeFilter !== 'all' ? t('page.organizations.filterEmpty') : t('page.organizations.empty') }}
        </p>
        <ul v-else class="organization-tree" role="tree" :aria-label="t('page.organizations.treeLabel')">
          <li
            v-for="(row, index) in visibleRows"
            :key="row.organization.id"
            role="treeitem"
            :aria-level="row.level"
            :aria-expanded="row.hasChildren ? row.expanded : undefined"
            :aria-selected="selectedId === row.organization.id"
          >
            <div class="organization-tree-row" :style="{ paddingInlineStart: `${(row.level - 1) * 16}px` }">
              <button
                v-if="row.hasChildren"
                type="button"
                class="organization-expander"
                :aria-label="row.expanded ? t('page.organizations.collapse', { name: row.organization.name }) : t('page.organizations.expand', { name: row.organization.name })"
                :data-testid="`organization-toggle-${row.organization.id}`"
                @click="toggleExpanded(row.organization.id)"
              >{{ row.expanded ? '−' : '+' }}</button>
              <span v-else class="organization-expander-spacer" aria-hidden="true" />
              <button
                :ref="(element) => setRowButton(row.organization.id, element as Element | null)"
                type="button"
                class="organization-node"
                :class="{ 'organization-node--selected': selectedId === row.organization.id }"
                :data-org-node="row.organization.id"
                :data-testid="`organization-node-${row.organization.id}`"
                @click="selectOrganization(row.organization.id)"
                @keydown="onTreeKeydown($event, row, index)"
              >
                <span class="organization-node__name">{{ row.organization.name }}</span>
                <span class="organization-node__code">{{ row.organization.code }}</span>
                <span class="gp-badge" :class="statusTone(row.organization.status)">{{ statusLabel(row.organization.status) }}</span>
              </button>
            </div>
          </li>
        </ul>
      </section>

      <aside class="gp-card organization-detail" :aria-label="t('page.organizations.detailTitle')">
        <template v-if="selected">
          <div class="organization-detail__heading">
            <div>
              <p class="gp-secondary">{{ selected.code }}</p>
              <h2 class="gp-card-title">{{ selected.name }}</h2>
            </div>
            <span class="gp-badge" :class="statusTone(selected.status)">{{ statusLabel(selected.status) }}</span>
          </div>

          <p v-if="selectedPath.length" class="organization-path" data-testid="organization-path">
            {{ selectedPath.map((organization) => organization.name).join(' / ') }}
          </p>

          <dl class="organization-facts">
            <div><dt>{{ t('page.organizations.typeLabel') }}</dt><dd>{{ typeLabel(selected.type) }}</dd></div>
            <div><dt>{{ t('page.organizations.depth') }}</dt><dd>{{ selected.depth }} / {{ ORGANIZATION_MAX_DEPTH }}</dd></div>
            <div><dt>{{ t('page.organizations.parent') }}</dt><dd>{{ selected.parent_id ? (getOrganization(organizations, selected.parent_id)?.name ?? selected.parent_id) : t('page.organizations.root') }}</dd></div>
            <div><dt>{{ t('page.organizations.version') }}</dt><dd>{{ selected.version }}</dd></div>
            <div><dt>{{ t('page.organizations.updatedAt') }}</dt><dd>{{ formatDate(selected.updated_at) }}</dd></div>
            <div><dt>{{ t('page.organizations.description') }}</dt><dd>{{ selected.description || t('page.organizations.notProvided') }}</dd></div>
          </dl>

          <div class="organization-actions">
            <UButton size="sm" icon="i-lucide-plus" :disabled="selected.depth >= ORGANIZATION_MAX_DEPTH || selected.status !== 'active'" data-testid="organization-create-child" @click="openCreate(selected.id)">
              {{ t('page.organizations.createChild') }}
            </UButton>
            <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-pencil" data-testid="organization-edit-open" @click="openEdit">
              {{ t('page.organizations.edit') }}
            </UButton>
            <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-move" :disabled="!selected.parent_id || moveTargetOptions.length === 0" data-testid="organization-move-open" @click="openMove">
              {{ t('page.organizations.move') }}
            </UButton>
            <UButton
              size="sm"
              :color="selected.status === 'active' ? 'error' : 'primary'"
              variant="outline"
              :icon="selected.status === 'active' ? 'i-lucide-ban' : 'i-lucide-circle-check'"
              data-testid="organization-status-open"
              @click="openStatus"
            >{{ nextStatusLabel }}</UButton>
          </div>

          <div class="organization-boundary">
            <strong>{{ t('page.organizations.boundaryTitle') }}</strong>
            <p>{{ t('page.organizations.boundaryBody') }}</p>
          </div>
        </template>
        <p v-else class="organization-empty">{{ t('page.organizations.noSelection') }}</p>
      </aside>
    </div>

    <UModal v-model:open="createOpen" :title="t('page.organizations.createTitle')" :description="t('page.organizations.createDescription')" data-testid="organization-create-modal">
      <template #body>
        <ComplexFormPattern
          :schema="createSchema"
          :initial-state="createInitialState"
          :fields="createFields"
          :submit-label="t('page.organizations.form.createSubmit')"
          @success="createOpen = false"
          :submitter="createOrganization"
        />
      </template>
    </UModal>

    <UModal v-model:open="editOpen" :title="t('page.organizations.editTitle')" :description="t('page.organizations.editDescription')" data-testid="organization-edit-modal">
      <template #body>
        <ComplexFormPattern
          :schema="editSchema"
          :initial-state="editInitialState"
          :fields="editFields"
          :submit-label="t('page.organizations.form.saveSubmit')"
          @success="editOpen = false"
          :submitter="updateOrganization"
        />
      </template>
    </UModal>

    <UModal v-model:open="moveOpen" :title="t('page.organizations.moveTitle')" :description="t('page.organizations.moveDescription')" data-testid="organization-move-modal">
      <template #body>
        <ComplexFormPattern
          :schema="moveSchema"
          :initial-state="moveInitialState"
          :fields="moveFields"
          :submit-label="t('page.organizations.form.moveSubmit')"
          @success="moveOpen = false"
          :submitter="moveOrganization"
        />
      </template>
    </UModal>

    <UModal v-model:open="statusOpen" :title="t('page.organizations.statusTitle')" :description="statusDescription" data-testid="organization-status-modal">
      <template #body>
        <p class="gp-body">{{ statusDescription }}</p>
        <p v-if="statusError" class="organization-error" role="alert">{{ statusError }}</p>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="statusOpen = false">{{ t('page.organizations.cancel') }}</UButton>
        <UButton :color="selected?.status === 'active' ? 'error' : 'primary'" :loading="statusSubmitting" :disabled="statusSubmitting" data-testid="organization-status-confirm" @click="applyStatusChange">{{ nextStatusLabel }}</UButton>
      </template>
    </UModal>
  </section>
</template>

<style scoped>
.organization-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gp-space-3); }
.organization-toolbar > :first-child { min-width: min(100%, 260px); flex: 1 1 260px; }
.organization-toolbar > :nth-child(2), .organization-toolbar > :nth-child(3) { min-width: 150px; }
.organization-keyboard-hint { margin-inline-start: auto; }
.organization-feedback { border-color: var(--gp-success-fg); }
.organization-layout { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(280px, 1fr); gap: var(--gp-section-gap); align-items: start; }
.organization-tree-panel, .organization-detail { min-width: 0; }
.organization-panel-heading, .organization-detail__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--gp-space-3); }
.organization-tree { list-style: none; margin: var(--gp-space-4) 0 0; padding: 0; display: grid; gap: var(--gp-space-1); }
.organization-tree-row { display: flex; align-items: center; gap: var(--gp-space-1); min-width: 0; border-radius: var(--gp-radius-control); }
.organization-tree-row:hover { background: var(--gp-primary-subtle); }
.organization-expander, .organization-expander-spacer { inline-size: 28px; min-inline-size: 28px; block-size: 32px; }
.organization-expander { border: 0; border-radius: var(--gp-radius-control); background: transparent; color: var(--gp-text-secondary); cursor: pointer; font-size: var(--gp-type-body-size); }
.organization-expander:focus-visible, .organization-node:focus-visible { outline: 2px solid var(--gp-primary-focus); outline-offset: 2px; }
.organization-node { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: var(--gp-space-2); inline-size: 100%; min-width: 0; padding: var(--gp-space-2); border: 0; border-radius: var(--gp-radius-control); background: transparent; color: inherit; text-align: start; cursor: pointer; }
.organization-node--selected { background: var(--gp-primary-subtle); box-shadow: inset 3px 0 0 var(--gp-primary); }
.organization-node__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.organization-node__code { color: var(--gp-text-secondary); font-size: var(--gp-type-caption-size); }
.organization-path { margin: var(--gp-space-2) 0 var(--gp-space-4); color: var(--gp-text-secondary); overflow-wrap: anywhere; }
.organization-facts { display: grid; gap: var(--gp-space-3); margin: 0 0 var(--gp-space-4); }
.organization-facts > div { display: grid; grid-template-columns: minmax(88px, .7fr) minmax(0, 1.3fr); gap: var(--gp-space-3); padding-block-end: var(--gp-space-2); border-bottom: 1px solid var(--gp-border-default); }
.organization-facts dt { color: var(--gp-text-secondary); }
.organization-facts dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.organization-actions { display: flex; flex-wrap: wrap; gap: var(--gp-space-2); }
.organization-boundary { margin-top: var(--gp-space-4); padding: var(--gp-space-3); border-radius: var(--gp-radius-control); background: var(--gp-page-bg); color: var(--gp-text-secondary); }
.organization-boundary strong { color: var(--gp-text-primary); }
.organization-boundary p { margin: var(--gp-space-1) 0 0; }
.organization-empty { margin: var(--gp-space-4) 0 0; padding: var(--gp-space-6); text-align: center; color: var(--gp-text-secondary); }
.organization-error { margin-top: var(--gp-space-3); padding: var(--gp-space-3); border-radius: var(--gp-radius-control); background: var(--gp-danger-bg); color: var(--gp-danger-fg); }
@media (max-width: 959px) { .organization-layout { grid-template-columns: 1fr; } .organization-keyboard-hint { margin-inline-start: 0; } }
@media (max-width: 639px) {
  .organization-toolbar { align-items: stretch; }
  .organization-toolbar > :first-child, .organization-toolbar > :nth-child(2), .organization-toolbar > :nth-child(3) { min-width: 100%; }
  .organization-node { grid-template-columns: minmax(0, 1fr) auto; }
  .organization-node__code { display: none; }
  .organization-facts > div { grid-template-columns: 1fr; gap: var(--gp-space-1); }
}
</style>
