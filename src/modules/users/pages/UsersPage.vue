<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TableColumn } from '@nuxt/ui/runtime/components/Table.vue'
import { z } from 'zod'
import ComplexFormPattern, { type ComplexFormField } from '../../../components/patterns/ComplexFormPattern.vue'
import DataTablePattern, { type DataTableQuery } from '../../../components/patterns/DataTablePattern.vue'
import { DATA_SCOPES, type DataScope } from '../../../types/admin'
import type { AdminRole, AdminUser, UserRoleBinding } from '../../../types/admin'
import { listOrganizations } from '../../../api/organizations'
import { listAdminRoles } from '../../../api/roles'
import {
  inviteUser as inviteAdminUser,
  listAdminUsers,
  resetUserCredential,
  revokeUserSessions,
  updateUserProfile,
  updateUserRoleBindings,
  updateUserStatus,
} from '../../../api/users'
import { formatApiError } from '../../../services/http'
import {
  canDeactivateUser,
  canSaveRoleBindings,
  summarizeUserRoles,
  updateRoleBindingScope,
} from '../model'

const { t, locale } = useI18n()

function idempotencyKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID?.() ?? Date.now()}`
}

function labelFor(options: Array<{ label: string; value: string }>, value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

function formatDate(value: string | null): string {
  if (!value) return t('page.users.never')
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

const users = ref<AdminUser[]>([])
const feedback = ref('')
const error = ref('')
const lookupError = ref('')
const organizationOptions = ref<Array<{ label: string; value: string }>>([])
const roleOptions = ref<Array<{ label: string; value: string; code: string; scope: DataScope }>>([])
const listRevision = ref(0)
const loadedRoleOptions = ref<AdminRole[]>([])
const selectedId = ref<string | null>(null)
const drawerOpen = ref(false)
const closeConfirmOpen = ref(false)
const credentialConfirm = ref<'reset' | 'logout' | null>(null)
const profileName = ref('')
const profileEmail = ref('')
const profileOrganizationId = ref('')
const draftBindings = ref<UserRoleBinding[]>([])
const addRoleId = ref('')
const addScope = ref<DataScope>('org')
const inviteOpen = ref(false)
const lookupsLoading = ref(false)
const profileSchema = computed(() => z.object({
  displayName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  organizationId: z.string().min(1),
}))

const statusOptions = computed(() => [
  { label: t('page.users.allStatuses'), value: 'all' },
  { label: t('page.users.active'), value: 'active' },
  { label: t('page.users.inactive'), value: 'inactive' },
])
const sourceOptions = computed(() => [
  { label: t('page.users.allSources'), value: 'all' },
  { label: t('page.users.local'), value: 'local' },
  { label: t('page.users.sso'), value: 'sso' },
])
const scopeOptions = computed(() => DATA_SCOPES.map((scope) => ({ label: t(`page.users.scopes.${scope}`), value: scope })))
const filters = computed(() => [
  { key: 'status', label: t('page.users.statusFilter'), options: statusOptions.value.slice(1) },
  { key: 'organization_id', label: t('page.users.organizationFilter'), options: organizationOptions.value },
  { key: 'source', label: t('page.users.sourceFilter'), options: sourceOptions.value.slice(1) },
])

const columns: TableColumn<AdminUser>[] = [
  { accessorKey: 'username', header: t('page.users.columnUsername') },
  { accessorKey: 'display_name', header: t('page.users.columnDisplayName') },
  { accessorKey: 'organization_name', header: t('page.users.columnOrganization') },
  { accessorKey: 'source', header: t('page.users.columnSource'), cell: ({ row }) => h('span', { class: 'gp-badge gp-badge--success' }, t(`page.users.${row.original.source}`)) },
  { accessorKey: 'status', header: t('page.users.columnStatus'), cell: ({ row }) => h('span', { class: ['gp-badge', row.original.status === 'active' ? 'gp-badge--success' : 'gp-badge--warning'] }, t(`page.users.${row.original.status}`)) },
  { id: 'roles', header: t('page.users.columnRoles'), cell: ({ row }) => h('span', { title: summarizeUserRoles(row.original) }, row.original.roles.map((role) => role.role_name).join(', ') || t('page.users.noRoles')) },
  { accessorKey: 'last_login_at', header: t('page.users.columnLastLogin'), cell: ({ row }) => formatDate(row.original.last_login_at) },
]

const selected = computed(() => users.value.find((user) => user.id === selectedId.value) ?? null)
const selectedRoleNames = computed(() => new Set(draftBindings.value.map((binding) => binding.role_id)))
const availableRoleOptions = computed(() => roleOptions.value.filter((option) => !selectedRoleNames.value.has(option.value)))
const profileDirty = computed(() => Boolean(selected.value && (profileName.value !== selected.value.display_name
  || profileEmail.value !== selected.value.email
  || profileOrganizationId.value !== selected.value.organization_id)))
const authDirty = computed(() => Boolean(selected.value && JSON.stringify(draftBindings.value) !== JSON.stringify(selected.value.roles)))
const hasDirtySection = computed(() => profileDirty.value || authDirty.value)
const permissions = computed(() => selected.value?.effective_permissions ?? [])

const tenantAdminRoleId = computed(() => loadedRoleOptions.value.find((role) => role.code === 'tenant_admin')?.id)

function isTenantAdminRole(roleId: string): boolean {
  return roleId === tenantAdminRoleId.value
}

function scopeOptionsForRole(roleId: string) {
  const role = loadedRoleOptions.value.find((candidate) => candidate.id === roleId)
  return role?.code === 'tenant_admin' ? scopeOptions.value.filter((option) => option.value === 'all') : scopeOptions.value
}

watch(addRoleId, (roleId) => {
  if (scopeOptionsForRole(roleId).every((option) => option.value === 'all')) addScope.value = 'all'
})

function openUser(user: AdminUser) {
  selectedId.value = user.id
  profileName.value = user.display_name
  profileEmail.value = user.email
  profileOrganizationId.value = user.organization_id
  draftBindings.value = JSON.parse(JSON.stringify(user.roles)) as UserRoleBinding[]
  addRoleId.value = availableRoleOptions.value[0]?.value ?? ''
  addScope.value = scopeOptionsForRole(addRoleId.value).every((option) => option.value === 'all') ? 'all' : 'org'
  feedback.value = ''
  error.value = ''
  drawerOpen.value = true
}

function requestDrawerOpen(open: boolean) {
  if (open) {
    drawerOpen.value = true
    return
  }
  if (hasDirtySection.value) {
    closeConfirmOpen.value = true
    return
  }
  drawerOpen.value = false
}

function discardAndClose() {
  closeConfirmOpen.value = false
  drawerOpen.value = false
}

async function loadUsers(query: DataTableQuery, signal?: AbortSignal) {
  const status = query.filters.status === 'active' || query.filters.status === 'inactive' ? query.filters.status : undefined
  const source = query.filters.source === 'local' || query.filters.source === 'sso' ? query.filters.source : undefined
  const sortBy = query.sorting[0]?.id as 'username' | 'display_name' | 'organization_name' | 'source' | 'status' | 'last_login_at' | 'updated_at' | undefined
  const result = await listAdminUsers({
    page: query.pagination.pageIndex + 1,
    perPage: query.pagination.pageSize,
    search: query.search.trim() || undefined,
    status,
    organizationId: query.filters.organization_id || undefined,
    source,
    sortBy,
    sortOrder: query.sorting[0] ? (query.sorting[0].desc ? 'desc' : 'asc') : undefined,
  }, { signal })
  if (!result.ok) throw new Error(formatApiError(result.error, t('page.users.loadFailed')))
  users.value = result.data.items
  return { data: result.data.items, total: result.data.pagination.total }
}

function replaceUser(updated: AdminUser) {
  users.value = users.value.map((user) => user.id === updated.id ? updated : user)
  listRevision.value += 1
}

async function loadLookups() {
  lookupsLoading.value = true
  lookupError.value = ''
  const [organizationResult, roleResult] = await Promise.all([
    listOrganizations({ page: 1, perPage: 100 }),
    listAdminRoles({ page: 1, perPage: 100 }),
  ])
  if (!organizationResult.ok || !roleResult.ok) {
    const failure = !organizationResult.ok ? organizationResult.error : roleResult.ok ? null : roleResult.error
    lookupError.value = failure ? formatApiError(failure, t('page.users.lookupFailed')) : t('page.users.lookupFailed')
    lookupsLoading.value = false
    return
  }
  organizationOptions.value = organizationResult.data.items.map((organization) => ({ label: organization.name, value: organization.id }))
  loadedRoleOptions.value = roleResult.data.items
  roleOptions.value = roleResult.data.items.map((role) => ({ label: role.name, value: role.id, code: role.code, scope: role.scope }))
  lookupsLoading.value = false
}

async function saveProfile() {
  if (!selected.value) return
  const parsed = profileSchema.value.safeParse({
    displayName: profileName.value,
    email: profileEmail.value,
    organizationId: profileOrganizationId.value,
  })
  if (!parsed.success) {
    error.value = t('page.users.errors.profileInvalid')
    return
  }
  error.value = ''
  const result = await updateUserProfile(selected.value.id, {
    displayName: parsed.data.displayName,
    email: parsed.data.email,
    organizationId: parsed.data.organizationId,
  }, { version: selected.value.version })
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.users.saveFailed'))
    return
  }
  replaceUser(result.data)
  profileName.value = result.data.display_name
  profileEmail.value = result.data.email
  profileOrganizationId.value = result.data.organization_id
  feedback.value = t('page.users.success.profileSaved', { name: result.data.display_name })
}

async function saveAuthorization() {
  if (!selected.value) return
  const precheck = canSaveRoleBindings(selected.value, draftBindings.value, tenantAdminRoleId.value)
  if (!precheck.ok) {
    error.value = t(`page.users.errors.${precheck.reason}`)
    return
  }
  error.value = ''
  const result = await updateUserRoleBindings(selected.value.id, {
    roles: draftBindings.value.map((binding) => ({ role_id: binding.role_id, scope: binding.scope })),
  }, { version: selected.value.version, idempotencyKey: idempotencyKey('user-roles') })
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.users.saveFailed'))
    return
  }
  replaceUser(result.data)
  draftBindings.value = JSON.parse(JSON.stringify(result.data.roles)) as UserRoleBinding[]
  feedback.value = t('page.users.success.authorizationSaved', { name: result.data.display_name })
}

function addRoleBinding() {
  if (!addRoleId.value || selectedRoleNames.value.has(addRoleId.value)) return
  error.value = ''
  const scope = scopeOptionsForRole(addRoleId.value).every((option) => option.value === 'all') ? 'all' : addScope.value
  draftBindings.value.push({ role_id: addRoleId.value, role_name: labelFor(roleOptions.value, addRoleId.value), scope })
  addRoleId.value = availableRoleOptions.value[0]?.value ?? ''
}

function removeRoleBinding(roleId: string) {
  error.value = ''
  draftBindings.value = draftBindings.value.filter((binding) => binding.role_id !== roleId)
}

function changeBindingScope(roleId: string, scope: DataScope) {
  if (isTenantAdminRole(roleId) && scope !== 'all') return
  error.value = ''
  draftBindings.value = updateRoleBindingScope(draftBindings.value, roleId, scope)
}

async function toggleUserStatus(user: AdminUser) {
  error.value = ''
  if (user.status === 'active') {
    const check = canDeactivateUser(user)
    if (!check.ok) {
      error.value = t(`page.users.errors.${check.reason}`)
      return
    }
  }
  const nextStatus = user.status === 'active' ? 'inactive' : 'active'
  const result = await updateUserStatus(user.id, { status: nextStatus }, {
    version: user.version,
    idempotencyKey: idempotencyKey('user-status'),
  })
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.users.saveFailed'))
    return
  }
  replaceUser(result.data)
  feedback.value = t(result.data.status === 'active' ? 'page.users.success.activated' : 'page.users.success.deactivated', { name: result.data.display_name })
}

const rowActions = (user: AdminUser) => [
  { label: t('page.users.view'), icon: 'i-lucide-panel-right-open', onSelect: () => openUser(user) },
  {
    label: user.status === 'active' ? t('page.users.deactivate') : t('page.users.activate'),
    icon: user.status === 'active' ? 'i-lucide-user-x' : 'i-lucide-user-check',
    color: user.status === 'active' ? 'error' as const : 'primary' as const,
    onSelect: () => toggleUserStatus(user),
  },
]

const inviteSchema = computed(() => z.object({
  username: z.string().trim().min(3).max(64),
  displayName: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  organizationId: z.string().min(1),
  roleId: z.string().min(1),
  scope: z.enum(DATA_SCOPES),
}))
function defaultInviteState(): Record<string, unknown> {
  const roleId = roleOptions.value.find((option) => option.scope !== 'all')?.value ?? roleOptions.value[0]?.value ?? ''
  return {
    username: '',
    displayName: '',
    email: '',
    organizationId: organizationOptions.value[0]?.value ?? '',
    roleId,
    scope: roleId && loadedRoleOptions.value.find((role) => role.id === roleId)?.code === 'tenant_admin' ? 'all' : 'org',
  }
}
const inviteInitialState = ref<Record<string, unknown>>(defaultInviteState())
const inviteFields = computed<ComplexFormField[]>(() => [
  { name: 'username', label: t('page.users.form.username'), required: true },
  { name: 'displayName', label: t('page.users.form.displayName'), required: true },
  { name: 'email', label: t('page.users.form.email'), required: true },
  { name: 'organizationId', label: t('page.users.form.organization'), type: 'select', required: true, options: organizationOptions.value },
  { name: 'roleId', label: t('page.users.form.role'), type: 'select', required: true, options: roleOptions.value },
  { name: 'scope', label: t('page.users.form.scope'), type: 'select', required: true, options: scopeOptions.value },
])

function openInvite() {
  inviteInitialState.value = defaultInviteState()
  inviteOpen.value = true
}

async function inviteUser(state: Record<string, unknown>) {
  const username = String(state.username).trim()
  const email = String(state.email).trim()
  if (users.value.some((user) => user.username === username)) throw new Error(t('page.users.errors.duplicateUsername'))
  if (users.value.some((user) => user.email.toLowerCase() === email.toLowerCase())) throw new Error(t('page.users.errors.duplicateEmail'))
  const roleId = String(state.roleId)
  const scope = state.scope as DataScope
  const result = await inviteAdminUser({
    username,
    displayName: String(state.displayName).trim(),
    email,
    organizationId: String(state.organizationId),
    roles: [{ role_id: roleId, scope }],
  }, { idempotencyKey: idempotencyKey('user-invite') })
  if (!result.ok) throw new Error(formatApiError(result.error, t('page.users.inviteFailed')))
  inviteOpen.value = false
  users.value = [result.data, ...users.value]
  listRevision.value += 1
  feedback.value = t('page.users.success.invited', { name: result.data.display_name })
}

function requestCredentialAction(action: 'reset' | 'logout') {
  credentialConfirm.value = action
}

async function confirmCredentialAction() {
  if (!selected.value || !credentialConfirm.value) return
  const action = credentialConfirm.value
  const result = action === 'reset'
    ? await resetUserCredential(selected.value.id, idempotencyKey('user-reset'))
    : await revokeUserSessions(selected.value.id, idempotencyKey('user-sessions'))
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.users.credentialFailed'))
    credentialConfirm.value = null
    return
  }
  replaceUser(result.data)
  feedback.value = t(action === 'reset' ? 'page.users.success.resetSent' : 'page.users.success.sessionsRevoked', { name: result.data.display_name })
  credentialConfirm.value = null
}

onMounted(() => { void loadLookups() })
</script>

<template>
  <section class="gp-page" data-testid="production-users">
    <header class="gp-page-header">
      <div>
        <p class="gp-secondary">{{ t('nav.iam') }}</p>
        <h1 class="gp-page-title">{{ t('page.users.title') }}</h1>
        <p class="gp-secondary">{{ t('page.users.subtitle') }}</p>
      </div>
      <UButton data-testid="user-invite-open" icon="i-lucide-user-plus" :loading="lookupsLoading" :disabled="lookupsLoading || organizationOptions.length === 0 || roleOptions.length === 0" @click="openInvite">{{ t('page.users.invite') }}</UButton>
    </header>

    <p v-if="lookupError" class="gp-card users-error" role="alert" data-testid="users-lookup-error">{{ lookupError }}</p>
    <p v-if="feedback && !drawerOpen" class="gp-card users-feedback" role="status" aria-live="polite" data-testid="users-feedback">{{ feedback }}</p>
    <p v-if="error && !drawerOpen" class="gp-card users-error" role="alert" data-testid="users-error">{{ error }}</p>

    <div class="gp-card">
      <DataTablePattern
        :rows="users"
        :columns="columns"
        :load="loadUsers"
        :refresh-token="listRevision"
        :search-keys="['username', 'display_name', 'email', 'organization_name']"
        :filters="filters"
        :row-actions="rowActions"
        :empty-message="t('page.users.empty')"
        :aria-label="t('page.users.tableLabel')"
        :page-size="6"
      />
    </div>

    <UDrawer
      :open="drawerOpen"
      direction="right"
      :title="selected?.display_name ?? t('page.users.detailTitle')"
      :description="t('page.users.detailDescription')"
      close
      :ui="{ content: 'w-full max-w-2xl ms-auto' }"
      @update:open="requestDrawerOpen"
    >
      <template #body>
        <div v-if="selected" class="user-detail" data-testid="user-detail">
          <p v-if="feedback" class="gp-card users-feedback" role="status" aria-live="polite" data-testid="user-detail-feedback">{{ feedback }}</p>
          <p v-if="error" class="gp-card users-error" role="alert" data-testid="user-detail-error">{{ error }}</p>
          <div class="user-detail-heading">
            <div>
              <p class="gp-secondary">{{ selected.username }} · {{ selected.email }}</p>
              <h2 class="gp-card-title">{{ selected.display_name }}</h2>
            </div>
            <span class="gp-badge" :class="selected.status === 'active' ? 'gp-badge--success' : 'gp-badge--warning'">{{ t(`page.users.${selected.status}`) }}</span>
          </div>

          <section class="user-section" :aria-label="t('page.users.profileSection')">
            <div class="user-section-heading">
              <h3 class="gp-card-title">{{ t('page.users.profileSection') }}</h3>
              <span v-if="profileDirty" class="gp-secondary">{{ t('page.users.unsaved') }}</span>
            </div>
            <div class="user-form-grid">
              <UFormField :label="t('page.users.form.displayName')"><UInput v-model="profileName" :aria-label="t('page.users.form.displayName')" /></UFormField>
              <UFormField :label="t('page.users.form.email')"><UInput v-model="profileEmail" type="email" :aria-label="t('page.users.form.email')" /></UFormField>
              <UFormField :label="t('page.users.form.organization')">
                <USelect v-model="profileOrganizationId" :items="organizationOptions" :aria-label="t('page.users.form.organization')" />
              </UFormField>
            </div>
            <UButton :disabled="!profileDirty" data-testid="user-profile-save" @click="saveProfile">{{ t('page.users.saveProfile') }}</UButton>
          </section>

          <section class="user-section" :aria-label="t('page.users.authorizationSection')">
            <div class="user-section-heading">
              <h3 class="gp-card-title">{{ t('page.users.authorizationSection') }}</h3>
              <span v-if="authDirty" class="gp-secondary">{{ t('page.users.unsaved') }}</span>
            </div>
            <p class="gp-secondary">{{ t('page.users.singleOrganization') }}</p>
            <ul class="user-role-list">
              <li v-for="binding in draftBindings" :key="binding.role_id" class="user-role-row">
                <strong>{{ binding.role_name }}</strong>
                <USelect :model-value="binding.scope" :items="scopeOptionsForRole(binding.role_id)" :disabled="isTenantAdminRole(binding.role_id)" :aria-label="t('page.users.bindingScope', { role: binding.role_name })" @update:model-value="changeBindingScope(binding.role_id, $event as DataScope)" />
                <UButton size="xs" color="error" variant="ghost" :aria-label="t('page.users.removeRole', { role: binding.role_name })" @click="removeRoleBinding(binding.role_id)">{{ t('page.users.remove') }}</UButton>
              </li>
            </ul>
            <div class="user-role-add">
              <USelect v-model="addRoleId" :items="availableRoleOptions" :aria-label="t('page.users.form.role')" />
              <USelect v-model="addScope" :items="scopeOptionsForRole(addRoleId)" :disabled="isTenantAdminRole(addRoleId)" :aria-label="t('page.users.form.scope')" />
              <UButton color="neutral" variant="outline" :disabled="!addRoleId" @click="addRoleBinding">{{ t('page.users.addRole') }}</UButton>
            </div>
            <UButton :disabled="!authDirty" data-testid="user-authorization-save" @click="saveAuthorization">{{ t('page.users.saveAuthorization') }}</UButton>
          </section>

          <section class="user-section" :aria-label="t('page.users.effectivePermissions')">
            <h3 class="gp-card-title">{{ t('page.users.effectivePermissions') }}</h3>
            <p class="gp-secondary">{{ t('page.users.effectiveHint') }}<span v-if="selected.permissions_version"> · v{{ selected.permissions_version }}</span></p>
            <ul class="user-permission-list" data-testid="user-permission-preview">
              <li v-for="permission in permissions" :key="permission"><code>{{ permission }}</code></li>
            </ul>
            <p v-if="permissions.length === 0" class="gp-secondary">{{ t('page.users.noEffectivePermissions') }}</p>
          </section>

          <section class="user-section user-credential" :aria-label="t('page.users.credentialSection')">
            <h3 class="gp-card-title">{{ t('page.users.credentialSection') }}</h3>
            <p class="gp-secondary">{{ t('page.users.credentialHint') }}</p>
            <div class="user-credential-actions">
              <UButton color="neutral" variant="outline" data-testid="user-reset-credential" @click="requestCredentialAction('reset')">{{ t('page.users.resetCredential') }}</UButton>
              <UButton color="error" variant="outline" data-testid="user-revoke-sessions" @click="requestCredentialAction('logout')">{{ t('page.users.revokeSessions') }}</UButton>
            </div>
          </section>
        </div>
      </template>
    </UDrawer>

    <UModal v-model:open="closeConfirmOpen" :title="t('page.users.discardTitle')" :description="t('page.users.discardDescription')">
      <template #footer>
        <UButton color="neutral" variant="outline" @click="closeConfirmOpen = false">{{ t('page.users.keepEditing') }}</UButton>
        <UButton color="error" @click="discardAndClose">{{ t('page.users.discard') }}</UButton>
      </template>
    </UModal>

    <UModal :open="credentialConfirm !== null" :title="t('page.users.credentialConfirmTitle')" :description="t('page.users.credentialConfirmDescription')" @update:open="!$event && (credentialConfirm = null)">
      <template #footer>
        <UButton color="neutral" variant="outline" @click="credentialConfirm = null">{{ t('page.users.cancel') }}</UButton>
        <UButton color="error" data-testid="user-credential-confirm" @click="confirmCredentialAction">{{ t('page.users.confirm') }}</UButton>
      </template>
    </UModal>

    <UModal v-model:open="inviteOpen" :title="t('page.users.inviteTitle')" :description="t('page.users.inviteDescription')">
      <template #body>
        <ComplexFormPattern
          :schema="inviteSchema"
          :initial-state="inviteInitialState"
          :fields="inviteFields"
          :submit-label="t('page.users.inviteSubmit')"
          :submitter="inviteUser"
          @success="inviteOpen = false"
        />
      </template>
    </UModal>
  </section>
</template>

<style scoped>
.users-feedback { border-color: var(--gp-success-fg); }
.users-error { border-color: var(--gp-danger-bg); color: var(--gp-danger-fg); }
.user-detail { display: grid; gap: var(--gp-section-gap); }
.user-detail-heading, .user-section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--gp-space-3); }
.user-section { display: grid; gap: var(--gp-space-3); padding-top: var(--gp-space-4); border-top: 1px solid var(--gp-border-default); }
.user-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gp-field-gap); }
.user-form-grid > :last-child { grid-column: 1 / -1; }
.user-role-list { list-style: none; display: grid; gap: var(--gp-space-2); padding: 0; margin: 0; }
.user-role-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(140px, .7fr) auto; align-items: center; gap: var(--gp-space-2); padding: var(--gp-space-2); border: 1px solid var(--gp-border-default); border-radius: var(--gp-radius-control); }
.user-role-add, .user-credential-actions { display: flex; flex-wrap: wrap; gap: var(--gp-space-2); }
.user-permission-list { display: flex; flex-wrap: wrap; gap: var(--gp-space-2); list-style: none; padding: 0; margin: 0; }
.user-permission-list li { padding: 2px 6px; border-radius: var(--gp-radius-tag); background: var(--gp-primary-subtle); }
.user-permission-list code { font-size: var(--gp-type-caption-size); }
.user-credential { padding: var(--gp-space-3); border: 1px solid var(--gp-danger-bg); border-radius: var(--gp-radius-control); }
@media (max-width: 639px) { .user-form-grid { grid-template-columns: 1fr; } .user-form-grid > :last-child { grid-column: auto; } .user-role-row { grid-template-columns: 1fr; } }
</style>
