<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { z } from 'zod'
import ComplexFormPattern, { type ComplexFormField } from '../../../components/patterns/ComplexFormPattern.vue'
import { DATA_SCOPES, type AdminRole, type AdminStatus, type DataScope, type PermissionGroup } from '../../../types/admin'
import { createAdminRole, listAdminRoles, listPermissionGroups, updateAdminRole, updateAdminRoleStatus } from '../../../api/roles'
import { formatApiError } from '../../../services/http'
import { createDebouncedTask } from '../../../utils/debounce'
import {
  canEditRole,
  changedPermissionCount,
  isRoleDraftDirty,
  permissionGroupState,
  permissionLabelKey,
  togglePermissionGroup,
} from '../model'

const { t } = useI18n()

function slugCode(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
}

const roles = ref<AdminRole[]>([])
const permissionGroups = ref<PermissionGroup[]>([])
const selectedId = ref('')
const search = ref('')
const statusFilter = ref<AdminStatus | 'all'>('all')
const loading = ref(false)
const listError = ref('')
const total = ref(0)
let listController: AbortController | null = null
const draftName = ref('')
const draftDescription = ref('')
const draftScope = ref<DataScope>('all')
const draftPermissions = ref<Set<string>>(new Set())
const feedback = ref('')
const error = ref('')
const createOpen = ref(false)
const discardOpen = ref(false)
type RoleIntent = { type: 'select'; roleId: string } | { type: 'create' } | { type: 'copy' } | { type: 'status' }
const pendingIntent = ref<RoleIntent | null>(null)
const debouncedReload = createDebouncedTask(() => { void loadRoles() })

function idempotencyKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID?.() ?? Date.now()}`
}

const roleDraftSchema = computed(() => z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500),
  scope: z.enum(DATA_SCOPES),
}))

const statusOptions = computed(() => [
  { label: t('page.roles.allStatuses'), value: 'all' },
  { label: t('page.roles.active'), value: 'active' },
  { label: t('page.roles.inactive'), value: 'inactive' },
])
const scopeOptions = computed(() => DATA_SCOPES.map((scope) => ({ label: t(`page.roles.scopes.${scope}`), value: scope })))

const filteredRoles = computed(() => roles.value)
const selected = computed(() => roles.value.find((role) => role.id === selectedId.value) ?? null)
const editable = computed(() => Boolean(selected.value && canEditRole(selected.value)))
const changedCount = computed(() => selected.value ? changedPermissionCount(selected.value, draftPermissions.value) : 0)
const draftDirty = computed(() => Boolean(selected.value && isRoleDraftDirty(selected.value, {
  name: draftName.value,
  description: draftDescription.value,
  scope: draftScope.value,
  permissions: draftPermissions.value,
})))
const canSave = computed(() => editable.value && draftDirty.value)

function resetDraft(role = selected.value) {
  if (!role) return
  draftName.value = role.name
  draftDescription.value = role.description
  draftScope.value = role.scope
  draftPermissions.value = new Set(role.permissions)
}

async function loadRoles() {
  listController?.abort()
  const controller = new AbortController()
  listController = controller
  loading.value = true
  listError.value = ''
  const result = await listAdminRoles({
    page: 1,
    perPage: 100,
    search: search.value.trim() || undefined,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
  }, { signal: controller.signal })
  if (controller.signal.aborted) return
  loading.value = false
  if (!result.ok) {
    if (result.error.code === 'CANCELED') return
    listError.value = formatApiError(result.error, t('page.roles.loadFailed'))
    roles.value = []
    total.value = 0
    selectedId.value = ''
    return
  }
  roles.value = result.data.items
  total.value = result.data.pagination.total
  if (!roles.value.some((role) => role.id === selectedId.value)) selectedId.value = roles.value[0]?.id ?? ''
}

async function loadPermissionGroups() {
  const result = await listPermissionGroups()
  if (!result.ok) {
    listError.value = formatApiError(result.error, t('page.roles.permissionLoadFailed'))
    permissionGroups.value = []
    return
  }
  permissionGroups.value = result.data.items
}

onMounted(() => {
  void Promise.all([loadRoles(), loadPermissionGroups()])
})

watch([search, statusFilter], () => {
  debouncedReload.schedule(250)
})

onBeforeUnmount(() => {
  debouncedReload.cancel()
  listController?.abort()
})

watch([selectedId, roles], () => resetDraft(), { deep: true, immediate: true })
watch(discardOpen, (open) => {
  if (!open) pendingIntent.value = null
})

function selectRole(roleId: string) {
  if (roleId === selectedId.value) return
  if (draftDirty.value) {
    pendingIntent.value = { type: 'select', roleId }
    discardOpen.value = true
    return
  }
  selectedId.value = roleId
  feedback.value = ''
  error.value = ''
}

function togglePermission(permissionId: string, checked: boolean) {
  if (!editable.value) return
  error.value = ''
  const next = new Set(draftPermissions.value)
  if (checked) next.add(permissionId)
  else next.delete(permissionId)
  draftPermissions.value = next
}

function toggleGroup(groupId: string) {
  if (!editable.value) return
  error.value = ''
  const group = permissionGroups.value.find((candidate) => candidate.id === groupId)
  if (group) draftPermissions.value = togglePermissionGroup(group, draftPermissions.value)
}

function groupState(groupId: string): 'all' | 'some' | 'none' {
  const group = permissionGroups.value.find((candidate) => candidate.id === groupId)
  return group ? permissionGroupState(group, draftPermissions.value) : 'none'
}

function replaceRole(updated: AdminRole) {
  roles.value = roles.value.map((role) => role.id === updated.id ? updated : role)
}

async function saveRole() {
  if (!selected.value || !editable.value) return
  const parsed = roleDraftSchema.value.safeParse({
    name: draftName.value,
    description: draftDescription.value,
    scope: draftScope.value,
  })
  if (!parsed.success) {
    error.value = t('page.roles.errors.invalidDraft')
    return
  }
  error.value = ''
  const result = await updateAdminRole(selected.value.id, {
    name: parsed.data.name,
    description: parsed.data.description,
    scope: parsed.data.scope,
    permissions: [...draftPermissions.value],
  }, { version: selected.value.version })
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.roles.saveFailed'))
    return
  }
  replaceRole(result.data)
  resetDraft(result.data)
  feedback.value = t('page.roles.success.saved', { name: result.data.name })
}

async function toggleRoleStatus() {
  if (!selected.value || selected.value.builtin) return
  error.value = ''
  const nextStatus = selected.value.status === 'active' ? 'inactive' : 'active'
  const result = await updateAdminRoleStatus(selected.value.id, { status: nextStatus }, {
    version: selected.value.version,
    idempotencyKey: idempotencyKey('role-status'),
  })
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.roles.saveFailed'))
    return
  }
  replaceRole(result.data)
  resetDraft(result.data)
  feedback.value = t(result.data.status === 'active' ? 'page.roles.success.activated' : 'page.roles.success.deactivated', { name: result.data.name })
}

async function copyRole() {
  if (!selected.value) return
  error.value = ''
  const baseCode = slugCode(selected.value.code) || 'role'
  let code = `${baseCode}_copy`
  let index = 2
  while (roles.value.some((role) => role.code === code)) code = `${baseCode}_copy_${index++}`
  const result = await createAdminRole({
    code,
    name: t('page.roles.copyName', { name: selected.value.name }),
    description: selected.value.description,
    scope: selected.value.scope,
    permissions: [...selected.value.permissions],
  }, { idempotencyKey: idempotencyKey('role-copy') })
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.roles.saveFailed'))
    return
  }
  roles.value = [result.data, ...roles.value]
  selectedId.value = result.data.id
  feedback.value = t('page.roles.success.copied', { name: result.data.name })
}

async function runIntent(intent: RoleIntent) {
  if (intent.type === 'select') {
    selectedId.value = intent.roleId
    feedback.value = ''
    error.value = ''
  } else if (intent.type === 'create') {
    openCreate()
  } else if (intent.type === 'copy') {
    await copyRole()
  } else {
    await toggleRoleStatus()
  }
}

async function requestIntent(intent: RoleIntent) {
  if (draftDirty.value) {
    pendingIntent.value = intent
    discardOpen.value = true
    return
  }
  await runIntent(intent)
}

async function requestCreate() {
  await requestIntent({ type: 'create' })
}

async function requestCopy() {
  await requestIntent({ type: 'copy' })
}

async function requestStatusToggle() {
  await requestIntent({ type: 'status' })
}

async function confirmDiscardAndContinue() {
  const intent = pendingIntent.value
  pendingIntent.value = null
  discardOpen.value = false
  error.value = ''
  resetDraft()
  if (intent) await runIntent(intent)
}

function cancelDiscard() {
  pendingIntent.value = null
  discardOpen.value = false
}

const createSchema = computed(() => z.object({
  code: z.string().trim().regex(/^[a-z][a-z0-9_]{2,63}$/),
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500),
  scope: z.enum(DATA_SCOPES),
}))
const createInitialState = ref<Record<string, unknown>>({ code: '', name: '', description: '', scope: 'org' })
const createFields = computed<ComplexFormField[]>(() => [
  { name: 'code', label: t('page.roles.form.code'), required: true, placeholder: 'content_editor' },
  { name: 'name', label: t('page.roles.form.name'), required: true },
  { name: 'description', label: t('page.roles.form.description') },
  { name: 'scope', label: t('page.roles.form.scope'), type: 'select', required: true, options: scopeOptions.value },
])

function openCreate() {
  error.value = ''
  createInitialState.value = { code: '', name: '', description: '', scope: 'org' }
  createOpen.value = true
}

async function createRole(state: Record<string, unknown>) {
  const code = String(state.code).trim()
  if (roles.value.some((role) => role.code === code)) throw new Error(t('page.roles.errors.duplicateCode'))
  const result = await createAdminRole({
    code,
    name: String(state.name).trim(),
    description: String(state.description ?? '').trim(),
    scope: state.scope as DataScope,
    permissions: [],
  }, { idempotencyKey: idempotencyKey('role-create') })
  if (!result.ok) throw new Error(formatApiError(result.error, t('page.roles.saveFailed')))
  roles.value = [result.data, ...roles.value]
  selectedId.value = result.data.id
  createOpen.value = false
  feedback.value = t('page.roles.success.created', { name: result.data.name })
}
</script>

<template>
  <section class="gp-page" data-testid="production-roles">
    <header class="gp-page-header">
      <div>
        <p class="gp-secondary">{{ t('nav.iam') }}</p>
        <h1 class="gp-page-title">{{ t('page.roles.title') }}</h1>
        <p class="gp-secondary">{{ t('page.roles.subtitle') }}</p>
      </div>
      <UButton data-testid="role-create-open" icon="i-lucide-plus" @click="requestCreate">{{ t('page.roles.create') }}</UButton>
    </header>

    <p v-if="feedback" class="gp-card role-feedback" role="status" aria-live="polite" data-testid="role-feedback">{{ feedback }}</p>
    <p v-if="error" class="gp-card role-error" role="alert" data-testid="role-error">{{ error }}</p>
    <p v-if="listError" class="gp-card role-error" role="alert" data-testid="role-list-error">{{ listError }}</p>

    <div class="role-layout">
      <section class="gp-card role-list-panel" :aria-label="t('page.roles.listTitle')">
        <div class="role-panel-heading">
          <div>
            <h2 class="gp-card-title">{{ t('page.roles.listTitle') }}</h2>
            <p class="gp-secondary">{{ t('page.roles.listCount', { count: total }) }}</p>
          </div>
          <span class="gp-badge gp-badge--success">{{ t('page.roles.serverData') }}</span>
        </div>
        <div class="role-toolbar" role="search" :aria-label="t('page.roles.filtersLabel')">
          <UInput v-model="search" type="search" :placeholder="t('page.roles.searchPlaceholder')" :aria-label="t('page.roles.search')" data-testid="role-search" />
          <USelect v-model="statusFilter" :items="statusOptions" :aria-label="t('page.roles.statusFilter')" />
        </div>
        <p v-if="loading" class="role-empty" role="status">{{ t('page.roles.loading') }}</p>
        <p v-else-if="filteredRoles.length === 0" class="role-empty" role="status">{{ t('page.roles.filterEmpty') }}</p>
        <ul v-else class="role-list">
          <li v-for="role in filteredRoles" :key="role.id">
            <button
              type="button"
              class="role-list-item"
              :class="{ 'role-list-item--selected': selectedId === role.id }"
              :aria-pressed="selectedId === role.id"
              :data-testid="`role-item-${role.id}`"
              @click="selectRole(role.id)"
            >
              <span class="role-list-item__heading">
                <strong>{{ role.name }}</strong>
                <span class="gp-badge" :class="role.builtin ? 'gp-badge--success' : 'gp-badge--warning'">{{ role.builtin ? t('page.roles.builtin') : t('page.roles.custom') }}</span>
              </span>
              <span class="gp-secondary">{{ role.code }} · {{ t(`page.roles.scopes.${role.scope}`) }} · {{ t('page.roles.userCount', { count: role.user_count }) }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section v-if="selected" class="gp-card role-detail" :aria-label="t('page.roles.detailTitle')">
        <div class="role-detail-heading">
          <div>
            <p class="gp-secondary">{{ selected.code }} · v{{ selected.version }}</p>
            <h2 class="gp-card-title">{{ selected.name }}</h2>
          </div>
          <div class="role-detail-badges">
            <span class="gp-badge" :class="selected.status === 'active' ? 'gp-badge--success' : 'gp-badge--warning'">{{ t(`page.roles.${selected.status}`) }}</span>
            <span class="gp-badge" :class="selected.builtin ? 'gp-badge--success' : 'gp-badge--warning'">{{ selected.builtin ? t('page.roles.builtin') : t('page.roles.custom') }}</span>
          </div>
        </div>

        <p v-if="selected.builtin" class="role-protected" data-testid="role-protected-notice">{{ t('page.roles.protectedNotice') }}</p>

        <div class="role-meta-grid">
          <UFormField :label="t('page.roles.form.name')">
            <UInput v-model="draftName" :disabled="!editable" :aria-label="t('page.roles.form.name')" />
          </UFormField>
          <UFormField :label="t('page.roles.form.scope')">
            <USelect v-model="draftScope" :items="scopeOptions" :disabled="!editable" :aria-label="t('page.roles.form.scope')" />
          </UFormField>
          <UFormField :label="t('page.roles.form.description')" class="role-meta-grid__wide">
            <UInput v-model="draftDescription" :disabled="!editable" :aria-label="t('page.roles.form.description')" />
          </UFormField>
        </div>

        <div class="role-matrix" role="group" :aria-label="t('page.roles.matrixTitle')" data-testid="role-permission-matrix">
          <div class="role-matrix-heading">
            <div>
              <h3 class="gp-card-title">{{ t('page.roles.matrixTitle') }}</h3>
              <p class="gp-secondary">{{ t('page.roles.matrixHint') }}</p>
            </div>
            <span class="gp-secondary">{{ t('page.roles.selectedPermissions', { count: draftPermissions.size }) }}</span>
          </div>
          <p v-if="permissionGroups.length === 0" class="role-empty" role="status">{{ t('page.roles.permissionDirectoryEmpty') }}</p>
          <section v-for="group in permissionGroups" :key="group.id" class="role-permission-group">
            <label class="role-permission-group__heading">
              <UCheckbox
                :model-value="groupState(group.id) === 'all'"
                :indeterminate="groupState(group.id) === 'some'"
                :disabled="!editable"
                :aria-label="t('page.roles.selectGroup', { group: t(group.labelKey) })"
                @update:model-value="toggleGroup(group.id)"
              />
              <span>{{ t(group.labelKey) }}</span>
            </label>
            <div class="role-permission-grid">
              <label v-for="permission in group.permissions" :key="permission.id" class="role-permission-item">
                <UCheckbox
                  :model-value="draftPermissions.has(permission.id)"
                  :disabled="!editable"
                  :aria-label="`${t(group.labelKey)} · ${t(permissionLabelKey(group, permission.actionKey))}`"
                  :data-testid="`permission-${permission.id}`"
                  @update:model-value="togglePermission(permission.id, Boolean($event))"
                />
                <span>
                  <strong>{{ t(permissionLabelKey(group, permission.actionKey)) }}</strong>
                  <code>{{ permission.id }}</code>
                </span>
              </label>
            </div>
          </section>
        </div>

        <div class="role-actions">
          <UButton :disabled="!canSave" data-testid="role-save" @click="saveRole">{{ t('page.roles.save') }}</UButton>
          <UButton color="neutral" variant="outline" :disabled="!editable || !draftDirty" @click="resetDraft()">{{ t('page.roles.reset') }}</UButton>
          <UButton color="neutral" variant="outline" icon="i-lucide-copy" @click="requestCopy">{{ t('page.roles.copy') }}</UButton>
          <UButton v-if="!selected.builtin" color="error" variant="outline" data-testid="role-status-toggle" @click="requestStatusToggle">{{ selected.status === 'active' ? t('page.roles.deactivate') : t('page.roles.activate') }}</UButton>
          <span v-if="draftDirty" class="gp-secondary" role="status">{{ changedCount > 0 ? t('page.roles.changeCount', { count: changedCount }) : t('page.roles.unsavedChanges') }}</span>
        </div>
      </section>
    </div>

    <UModal v-model:open="createOpen" :title="t('page.roles.createTitle')" :description="t('page.roles.createDescription')">
      <template #body>
        <ComplexFormPattern
          :schema="createSchema"
          :initial-state="createInitialState"
          :fields="createFields"
          :submit-label="t('page.roles.createSubmit')"
          :submitter="createRole"
          @success="createOpen = false"
        />
      </template>
    </UModal>

    <UModal v-model:open="discardOpen" :title="t('page.roles.discardTitle')" :description="t('page.roles.discardDescription')">
      <template #footer>
        <UButton color="neutral" variant="outline" @click="cancelDiscard">{{ t('page.roles.keepEditing') }}</UButton>
        <UButton color="error" data-testid="role-discard-confirm" @click="confirmDiscardAndContinue">{{ t('page.roles.discard') }}</UButton>
      </template>
    </UModal>
  </section>
</template>

<style scoped>
.role-feedback { border-color: var(--gp-success-fg); }
.role-error { border-color: var(--gp-danger-bg); color: var(--gp-danger-fg); }
.role-layout { display: grid; grid-template-columns: minmax(240px, .75fr) minmax(0, 1.9fr); gap: var(--gp-section-gap); align-items: start; }
.role-panel-heading, .role-detail-heading, .role-matrix-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--gp-space-3); }
.role-toolbar { display: grid; gap: var(--gp-space-2); margin-top: var(--gp-space-3); }
.role-list { list-style: none; padding: 0; margin: var(--gp-space-3) 0 0; display: grid; gap: var(--gp-space-2); }
.role-list-item { inline-size: 100%; display: grid; gap: var(--gp-space-1); text-align: start; border: 1px solid var(--gp-border-default); border-radius: var(--gp-radius-control); padding: var(--gp-space-3); background: var(--gp-surface-default); color: inherit; cursor: pointer; }
.role-list-item:hover, .role-list-item--selected { background: var(--gp-primary-subtle); border-color: var(--gp-primary); }
.role-list-item:focus-visible { outline: 2px solid var(--gp-primary-focus); outline-offset: 2px; }
.role-list-item__heading, .role-detail-badges { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gp-space-2); }
.role-empty { padding: var(--gp-space-6); text-align: center; color: var(--gp-text-secondary); }
.role-detail { display: grid; gap: var(--gp-space-4); min-width: 0; }
.role-protected { margin: 0; padding: var(--gp-space-3); border-radius: var(--gp-radius-control); background: var(--gp-warning-bg); color: var(--gp-warning-fg); }
.role-meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gp-field-gap); }
.role-meta-grid__wide { grid-column: 1 / -1; }
.role-matrix { display: grid; gap: var(--gp-space-3); padding-top: var(--gp-space-4); border-top: 1px solid var(--gp-border-default); }
.role-permission-group { display: grid; gap: var(--gp-space-2); padding: var(--gp-space-3); border: 1px solid var(--gp-border-default); border-radius: var(--gp-radius-control); }
.role-permission-group__heading { display: flex; align-items: center; gap: var(--gp-space-2); font-weight: 600; }
.role-permission-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gp-space-2); padding-inline-start: var(--gp-space-5); }
.role-permission-item { display: flex; align-items: flex-start; gap: var(--gp-space-2); min-width: 0; }
.role-permission-item span { display: grid; gap: 2px; min-width: 0; }
.role-permission-item code { overflow: hidden; text-overflow: ellipsis; color: var(--gp-text-secondary); font-size: var(--gp-type-caption-size); }
.role-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gp-space-2); }
@media (max-width: 959px) { .role-layout, .role-permission-grid { grid-template-columns: 1fr; } }
@media (max-width: 639px) { .role-meta-grid { grid-template-columns: 1fr; } .role-meta-grid__wide { grid-column: auto; } .role-permission-grid { padding-inline-start: 0; } }
</style>
