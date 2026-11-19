<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ANNOUNCEMENT_STATUSES,
  type AdminAnnouncement,
  type AnnouncementAudience,
  type AnnouncementPreviewSnapshot,
  type AnnouncementStatus,
} from '../../../types/admin'
import { listOrganizations } from '../../../api/organizations'
import { listAdminRoles } from '../../../api/roles'
import {
  createAdminAnnouncement,
  duplicateAnnouncement as duplicateAdminAnnouncement,
  listAdminAnnouncements,
  publishAnnouncement,
  scheduleAnnouncement,
  updateAdminAnnouncement,
  withdrawAnnouncement,
} from '../../../api/announcements'
import { formatApiError } from '../../../services/http'
import { createDebouncedTask } from '../../../utils/debounce'
import {
  availableAnnouncementActions,
  canTransitionAnnouncement,
  createAnnouncementPreview,
  isAnnouncementEditable,
  normalizeAnnouncementAudience,
  toDateTimeLocalInput,
  validateAnnouncementContent,
  validateAnnouncementSchedule,
} from '../model'

const { t, locale } = useI18n()

function formatDate(value: string | null): string {
  if (!value) return t('page.announcements.notScheduled')
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function badgeClass(status: AnnouncementStatus): string {
  if (status === 'published') return 'gp-badge--success'
  if (status === 'withdrawn') return 'gp-badge--danger'
  return 'gp-badge--warning'
}

const announcements = ref<AdminAnnouncement[]>([])
const audienceOrganizationOptions = ref<Array<{ label: string; value: string }>>([])
const audienceRoleOptions = ref<Array<{ label: string; value: string }>>([])
const selectedId = ref('')
const search = ref('')
const statusFilter = ref<AnnouncementStatus | 'all'>('all')
const loading = ref(false)
const listError = ref('')
const lookupError = ref('')
const total = ref(0)
let listController: AbortController | null = null
const draftTitle = ref('')
const draftBody = ref('')
const draftAll = ref(false)
const draftOrganizationIds = ref<Set<string>>(new Set())
const draftRoleCodes = ref<Set<string>>(new Set())
const scheduleAt = ref('')
const feedback = ref('')
const error = ref('')
const previewOpen = ref(false)
const previewSnapshot = ref<AnnouncementPreviewSnapshot | null>(null)
const confirmOpen = ref(false)
const pendingAction = ref<'publish' | 'schedule' | 'withdraw' | null>(null)
const discardOpen = ref(false)
type AnnouncementIntent = { type: 'select'; announcementId: string } | { type: 'create' } | { type: 'duplicate' }
const pendingIntent = ref<AnnouncementIntent | null>(null)
const debouncedReload = createDebouncedTask(() => { void loadAnnouncements() })

function idempotencyKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID?.() ?? Date.now()}`
}

const statusOptions = computed(() => [
  { label: t('page.announcements.allStatuses'), value: 'all' },
  ...ANNOUNCEMENT_STATUSES.map((status) => ({ label: t(`page.announcements.statuses.${status}`), value: status })),
])
const filteredAnnouncements = computed(() => announcements.value)
const selected = computed(() => announcements.value.find((announcement) => announcement.id === selectedId.value) ?? null)
const editable = computed(() => Boolean(selected.value && isAnnouncementEditable(selected.value.status)))
const actions = computed(() => selected.value ? availableAnnouncementActions(selected.value.status) : [])
const draftAudience = computed<AnnouncementAudience>(() => normalizeAnnouncementAudience({
  all: draftAll.value,
  organization_ids: [...draftOrganizationIds.value],
  role_codes: [...draftRoleCodes.value],
}))
const audienceSummary = computed(() => {
  if (draftAll.value) return t('page.announcements.audienceAll')
  const organizations = audienceOrganizationOptions.value.filter((option) => draftOrganizationIds.value.has(option.value)).map((option) => option.label)
  const roles = audienceRoleOptions.value.filter((option) => draftRoleCodes.value.has(option.value)).map((option) => option.label)
  if (organizations.length === 0 && roles.length === 0) return t('page.announcements.audienceEmpty')
  return [organizations.length ? t('page.announcements.audienceOrganizations', { values: organizations.join('、') }) : '', roles.length ? t('page.announcements.audienceRoles', { values: roles.join('、') }) : ''].filter(Boolean).join(' · ')
})
const draftDirty = computed(() => {
  if (!selected.value || !editable.value) return false
  const original = selected.value
  return draftTitle.value.trim() !== original.title
    || draftBody.value.trim() !== original.body
    || draftAll.value !== original.audience.all
    || [...draftOrganizationIds.value].sort().join(',') !== [...original.audience.organization_ids].sort().join(',')
    || [...draftRoleCodes.value].sort().join(',') !== [...original.audience.role_codes].sort().join(',')
})
const confirmableAction = computed(() => {
  if (pendingAction.value === 'publish') return { title: t('page.announcements.confirmPublishTitle'), body: t('page.announcements.confirmPublishBody'), submit: t('page.announcements.publish') }
  if (pendingAction.value === 'schedule') return { title: t('page.announcements.confirmScheduleTitle'), body: t('page.announcements.confirmScheduleBody', { time: scheduleAt.value ? formatDate(scheduleAt.value) : t('page.announcements.notScheduled') }), submit: t('page.announcements.schedule') }
  return { title: t('page.announcements.confirmWithdrawTitle'), body: t('page.announcements.confirmWithdrawBody'), submit: t('page.announcements.withdraw') }
})

async function loadAnnouncements() {
  listController?.abort()
  const controller = new AbortController()
  listController = controller
  loading.value = true
  listError.value = ''
  const result = await listAdminAnnouncements({
    page: 1,
    perPage: 100,
    search: search.value.trim() || undefined,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
  }, { signal: controller.signal })
  if (controller.signal.aborted) return
  loading.value = false
  if (!result.ok) {
    listError.value = formatApiError(result.error, t('page.announcements.loadFailed'))
    announcements.value = []
    total.value = 0
    selectedId.value = ''
    return
  }
  announcements.value = result.data.items
  total.value = result.data.pagination.total
  if (!announcements.value.some((announcement) => announcement.id === selectedId.value)) {
    selectedId.value = announcements.value[0]?.id ?? ''
  }
}

async function loadAudienceOptions() {
  const [organizationResult, roleResult] = await Promise.all([
    listOrganizations({ page: 1, perPage: 100 }),
    listAdminRoles({ page: 1, perPage: 100 }),
  ])
  if (!organizationResult.ok || !roleResult.ok) {
    const failure = !organizationResult.ok ? organizationResult.error : roleResult.ok ? null : roleResult.error
    lookupError.value = failure ? formatApiError(failure, t('page.announcements.lookupFailed')) : t('page.announcements.lookupFailed')
    return
  }
  audienceOrganizationOptions.value = organizationResult.data.items.map((organization) => ({ label: organization.name, value: organization.id }))
  audienceRoleOptions.value = roleResult.data.items.map((role) => ({ label: role.name, value: role.code }))
}

function replaceAnnouncement(updated: AdminAnnouncement) {
  announcements.value = announcements.value.map((announcement) => announcement.id === updated.id ? updated : announcement)
}

onMounted(() => {
  void Promise.all([loadAnnouncements(), loadAudienceOptions()])
})
watch([search, statusFilter], () => { debouncedReload.schedule(250) })
onBeforeUnmount(() => {
  debouncedReload.cancel()
  listController?.abort()
})

function resetDraft(announcement: AdminAnnouncement | null | undefined) {
  if (!announcement) return
  draftTitle.value = announcement.title
  draftBody.value = announcement.body
  const audience = normalizeAnnouncementAudience(announcement.audience)
  draftAll.value = audience.all
  draftOrganizationIds.value = new Set(audience.organization_ids)
  draftRoleCodes.value = new Set(audience.role_codes)
  scheduleAt.value = toDateTimeLocalInput(announcement.scheduled_at)
}

watch(selectedId, () => {
  resetDraft(selected.value)
}, { immediate: true })

watch(discardOpen, (open) => {
  if (!open) pendingIntent.value = null
})
watch(confirmOpen, (open) => {
  if (!open) pendingAction.value = null
})

function selectAnnouncement(announcementId: string) {
  if (announcementId === selectedId.value) return
  if (draftDirty.value) {
    pendingIntent.value = { type: 'select', announcementId }
    discardOpen.value = true
    return
  }
  feedback.value = ''
  error.value = ''
  selectedId.value = announcementId
}

function toggleOrganization(organizationId: string, checked: boolean) {
  if (!editable.value) return
  const next = new Set(draftOrganizationIds.value)
  if (checked) next.add(organizationId)
  else next.delete(organizationId)
  draftOrganizationIds.value = next
}

function toggleRole(roleCode: string, checked: boolean) {
  if (!editable.value) return
  const next = new Set(draftRoleCodes.value)
  if (checked) next.add(roleCode)
  else next.delete(roleCode)
  draftRoleCodes.value = next
}

function validateDraftContent(requireBodyAndAudience: boolean): boolean {
  const result = validateAnnouncementContent({
    title: draftTitle.value,
    body: draftBody.value,
    audience: draftAudience.value,
  }, { requireBodyAndAudience })
  if (!result.ok) {
    error.value = t(`page.announcements.errors.${result.reason}`)
    return false
  }
  error.value = ''
  return true
}

async function saveDraft(): Promise<boolean> {
  if (!selected.value || !editable.value || !validateDraftContent(false)) return false
  const result = await updateAdminAnnouncement(selected.value.id, {
    title: draftTitle.value.trim(),
    body: draftBody.value.trim(),
    audience: draftAudience.value,
  }, { version: selected.value.version })
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.announcements.saveFailed'))
    return false
  }
  replaceAnnouncement(result.data)
  resetDraft(result.data)
  feedback.value = t('page.announcements.success.saved', { title: result.data.title })
  return true
}

function previewAnnouncement() {
  if (!selected.value) return
  if (editable.value && !validateDraftContent(false)) return
  const candidate = editable.value
    ? { ...selected.value, title: draftTitle.value.trim(), body: draftBody.value.trim() }
    : selected.value
  const snapshot = !editable.value && selected.value.preview_snapshot
    ? selected.value.preview_snapshot
    : createAnnouncementPreview(candidate, audienceSummary.value)
  previewSnapshot.value = snapshot
  previewOpen.value = true
}

function requestAction(action: 'publish' | 'schedule' | 'withdraw') {
  if (!selected.value) return
  error.value = ''
  if ((action === 'publish' || action === 'schedule') && !validateDraftContent(true)) return
  if (action === 'schedule') {
    const schedule = validateAnnouncementSchedule(scheduleAt.value)
    if (!schedule.ok) {
      error.value = t(`page.announcements.errors.${schedule.reason}`)
      return
    }
  }
  pendingAction.value = action
  confirmOpen.value = true
}

async function applyAction() {
  if (!selected.value || !pendingAction.value) return
  const action = pendingAction.value
  if (action === 'publish') {
    if (!canTransitionAnnouncement(selected.value.status, 'published')) return
    if (draftDirty.value && !(await saveDraft())) {
      pendingAction.value = null
      confirmOpen.value = false
      return
    }
    const result = await publishAnnouncement(selected.value.id, {
      version: selected.value.version,
      idempotencyKey: idempotencyKey('announcement-publish'),
    })
    if (!result.ok) {
      error.value = formatApiError(result.error, t('page.announcements.publishFailed'))
      pendingAction.value = null
      confirmOpen.value = false
      return
    }
    replaceAnnouncement(result.data)
    selectedId.value = result.data.id
    feedback.value = t('page.announcements.success.published', { title: result.data.title })
  } else if (action === 'schedule') {
    if (!canTransitionAnnouncement(selected.value.status, 'scheduled')) return
    const schedule = validateAnnouncementSchedule(scheduleAt.value)
    if (!schedule.ok) {
      error.value = t(`page.announcements.errors.${schedule.reason}`)
      pendingAction.value = null
      confirmOpen.value = false
      return
    }
    if (draftDirty.value && !(await saveDraft())) {
      pendingAction.value = null
      confirmOpen.value = false
      return
    }
    const result = await scheduleAnnouncement(selected.value.id, schedule.date.toISOString(), {
      version: selected.value.version,
      idempotencyKey: idempotencyKey('announcement-schedule'),
    })
    if (!result.ok) {
      error.value = formatApiError(result.error, t('page.announcements.scheduleFailed'))
      pendingAction.value = null
      confirmOpen.value = false
      return
    }
    replaceAnnouncement(result.data)
    selectedId.value = result.data.id
    feedback.value = t('page.announcements.success.scheduled', { title: result.data.title })
  } else {
    if (!canTransitionAnnouncement(selected.value.status, 'withdrawn')) return
    const result = await withdrawAnnouncement(selected.value.id, {
      version: selected.value.version,
      idempotencyKey: idempotencyKey('announcement-withdraw'),
    })
    if (!result.ok) {
      error.value = formatApiError(result.error, t('page.announcements.withdrawFailed'))
      pendingAction.value = null
      confirmOpen.value = false
      return
    }
    replaceAnnouncement(result.data)
    selectedId.value = result.data.id
    feedback.value = t('page.announcements.success.withdrawn', { title: result.data.title })
  }
  pendingAction.value = null
  confirmOpen.value = false
  resetDraft(selected.value)
}

async function duplicateSelected() {
  if (!selected.value) return
  error.value = ''
  const result = await duplicateAdminAnnouncement(selected.value.id, { idempotencyKey: idempotencyKey('announcement-duplicate') })
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.announcements.duplicateFailed'))
    return
  }
  announcements.value = [result.data, ...announcements.value]
  total.value += 1
  selectedId.value = result.data.id
  feedback.value = t('page.announcements.success.duplicated', { title: result.data.title })
}

async function runIntent(intent: AnnouncementIntent) {
  if (intent.type === 'select') {
    feedback.value = ''
    error.value = ''
    selectedId.value = intent.announcementId
  } else if (intent.type === 'create') {
    await createAnnouncement()
  } else {
    await duplicateSelected()
  }
}

async function requestIntent(intent: AnnouncementIntent) {
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

async function requestDuplicate() {
  await requestIntent({ type: 'duplicate' })
}

async function confirmDiscardAndContinue() {
  const intent = pendingIntent.value
  pendingIntent.value = null
  discardOpen.value = false
  error.value = ''
  resetDraft(selected.value)
  if (intent) await runIntent(intent)
}

function cancelDiscard() {
  pendingIntent.value = null
  discardOpen.value = false
}

async function createAnnouncement() {
  error.value = ''
  const result = await createAdminAnnouncement({
    title: t('page.announcements.newDraftTitle'),
    body: '',
    audience: { all: false, organization_ids: [], role_codes: [] },
  }, idempotencyKey('announcement-create'))
  if (!result.ok) {
    error.value = formatApiError(result.error, t('page.announcements.createFailed'))
    return
  }
  announcements.value = [result.data, ...announcements.value]
  total.value += 1
  selectedId.value = result.data.id
  feedback.value = t('page.announcements.success.created')
}
</script>

<template>
  <section class="gp-page" data-testid="production-announcements">
    <header class="gp-page-header">
      <div>
        <p class="gp-secondary">{{ t('nav.content') }}</p>
        <h1 class="gp-page-title">{{ t('page.announcements.title') }}</h1>
        <p class="gp-secondary">{{ t('page.announcements.subtitle') }}</p>
      </div>
      <UButton data-testid="announcement-create" icon="i-lucide-plus" @click="requestCreate">{{ t('page.announcements.create') }}</UButton>
    </header>

    <p v-if="feedback" class="gp-card announcement-feedback" role="status" aria-live="polite" data-testid="announcement-feedback">{{ feedback }}</p>
    <p v-if="error" class="gp-card announcement-error" role="alert" data-testid="announcement-error">{{ error }}</p>
    <p v-if="listError" class="gp-card announcement-error" role="alert" data-testid="announcement-list-error">{{ listError }}</p>
    <p v-if="lookupError" class="gp-card announcement-error" role="alert" data-testid="announcement-lookup-error">{{ lookupError }}</p>

    <div class="announcement-layout">
      <section class="gp-card announcement-list-panel" :aria-label="t('page.announcements.listTitle')">
        <div class="announcement-panel-heading">
          <div>
            <h2 class="gp-card-title">{{ t('page.announcements.listTitle') }}</h2>
            <p class="gp-secondary">{{ t('page.announcements.listCount', { count: total }) }}</p>
          </div>
          <span class="gp-badge gp-badge--success">{{ t('page.announcements.serverData') }}</span>
        </div>
        <div class="announcement-toolbar" role="search" :aria-label="t('page.announcements.filtersLabel')">
          <UInput v-model="search" type="search" :placeholder="t('page.announcements.searchPlaceholder')" :aria-label="t('page.announcements.search')" data-testid="announcement-search" />
          <USelect v-model="statusFilter" :items="statusOptions" :aria-label="t('page.announcements.statusFilter')" />
        </div>
        <p v-if="loading" class="announcement-empty" role="status">{{ t('page.announcements.loading') }}</p>
        <p v-else-if="filteredAnnouncements.length === 0" class="announcement-empty" role="status">{{ t('page.announcements.filterEmpty') }}</p>
        <ul v-else class="announcement-list">
          <li v-for="announcement in filteredAnnouncements" :key="announcement.id">
            <button type="button" class="announcement-list-item" :class="{ 'announcement-list-item--selected': selectedId === announcement.id }" :aria-pressed="selectedId === announcement.id" :data-testid="`announcement-item-${announcement.id}`" @click="selectAnnouncement(announcement.id)">
              <span class="announcement-list-item__heading">
                <strong>{{ announcement.title }}</strong>
                <span class="gp-badge" :class="badgeClass(announcement.status)">{{ t(`page.announcements.statuses.${announcement.status}`) }}</span>
              </span>
              <span class="gp-secondary">{{ announcement.author }} · {{ formatDate(announcement.updated_at) }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section v-if="selected" class="gp-card announcement-editor" :aria-label="t('page.announcements.editorTitle')">
        <div class="announcement-editor-heading">
          <div>
            <p class="gp-secondary">{{ selected.id }} · v{{ selected.version }}</p>
            <h2 class="gp-card-title">{{ selected.title }}</h2>
          </div>
          <span class="gp-badge" :class="badgeClass(selected.status)">{{ t(`page.announcements.statuses.${selected.status}`) }}</span>
        </div>

        <p v-if="!editable" class="announcement-readonly-notice">{{ t('page.announcements.readonlyNotice') }}</p>

        <div class="announcement-form">
          <UFormField :label="t('page.announcements.form.title')">
            <UInput v-model="draftTitle" :disabled="!editable" :maxlength="120" :aria-label="t('page.announcements.form.title')" data-testid="announcement-title" />
          </UFormField>
          <UFormField :label="t('page.announcements.form.body')">
            <UTextarea v-model="draftBody" :disabled="!editable" :rows="6" :maxlength="5000" :aria-label="t('page.announcements.form.body')" data-testid="announcement-body" />
          </UFormField>
        </div>

        <section class="announcement-audience" :aria-label="t('page.announcements.audienceTitle')">
          <div class="announcement-section-heading">
            <div>
              <h3 class="gp-card-title">{{ t('page.announcements.audienceTitle') }}</h3>
              <p class="gp-secondary">{{ t('page.announcements.audienceHint') }}</p>
            </div>
            <span class="gp-secondary">{{ t('page.announcements.audienceServerHint') }}</span>
          </div>
          <label class="announcement-audience-all">
            <UCheckbox v-model="draftAll" :disabled="!editable" data-testid="announcement-audience-all" />
            <span>{{ t('page.announcements.audienceAll') }}</span>
          </label>
          <div class="announcement-audience-grid">
            <fieldset :disabled="!editable || draftAll">
              <legend>{{ t('page.announcements.organizations') }}</legend>
              <label v-for="option in audienceOrganizationOptions" :key="option.value" class="announcement-audience-option">
                <UCheckbox :model-value="draftOrganizationIds.has(option.value)" :disabled="!editable || draftAll" @update:model-value="toggleOrganization(option.value, Boolean($event))" />
                <span>{{ option.label }}</span>
              </label>
            </fieldset>
            <fieldset :disabled="!editable || draftAll">
              <legend>{{ t('page.announcements.roles') }}</legend>
              <label v-for="option in audienceRoleOptions" :key="option.value" class="announcement-audience-option">
                <UCheckbox :model-value="draftRoleCodes.has(option.value)" :disabled="!editable || draftAll" @update:model-value="toggleRole(option.value, Boolean($event))" />
                <span>{{ option.label }}</span>
              </label>
            </fieldset>
          </div>
          <p class="announcement-audience-summary" data-testid="announcement-audience-summary">{{ audienceSummary }}</p>
        </section>

        <div v-if="selected.preview_snapshot" class="announcement-snapshot">
          <strong>{{ t('page.announcements.previewSnapshot') }}</strong>
          <span>{{ formatDate(selected.preview_snapshot.generated_at) }} · {{ selected.preview_snapshot.audience_summary }}</span>
        </div>

        <div class="announcement-actions">
          <template v-if="actions.includes('edit')">
            <UButton :disabled="!draftDirty" data-testid="announcement-save" @click="saveDraft">{{ t('page.announcements.saveDraft') }}</UButton>
          </template>
          <UButton color="neutral" variant="outline" data-testid="announcement-preview" @click="previewAnnouncement">{{ t('page.announcements.preview') }}</UButton>
          <UButton v-if="actions.includes('publish')" data-testid="announcement-publish" @click="requestAction('publish')">{{ t('page.announcements.publish') }}</UButton>
          <UButton v-if="actions.includes('schedule')" color="neutral" variant="outline" data-testid="announcement-schedule" @click="requestAction('schedule')">{{ t('page.announcements.schedule') }}</UButton>
          <UButton v-if="actions.includes('withdraw')" color="error" variant="outline" data-testid="announcement-withdraw" @click="requestAction('withdraw')">{{ t('page.announcements.withdraw') }}</UButton>
          <UButton v-if="actions.includes('duplicate')" color="neutral" variant="outline" icon="i-lucide-copy" data-testid="announcement-duplicate" @click="requestDuplicate">{{ t('page.announcements.duplicate') }}</UButton>
        </div>

        <div v-if="editable" class="announcement-schedule">
          <UFormField :label="t('page.announcements.form.scheduleAt')">
            <input v-model="scheduleAt" type="datetime-local" class="gp-app-select" :aria-label="t('page.announcements.form.scheduleAt')" />
          </UFormField>
          <p class="gp-secondary">{{ t('page.announcements.scheduleHint') }}</p>
        </div>

        <dl class="announcement-facts">
          <div><dt>{{ t('page.announcements.author') }}</dt><dd>{{ selected.author }}</dd></div>
          <div><dt>{{ t('page.announcements.createdAt') }}</dt><dd>{{ formatDate(selected.created_at) }}</dd></div>
          <div><dt>{{ t('page.announcements.updatedAt') }}</dt><dd>{{ formatDate(selected.updated_at) }}</dd></div>
          <div><dt>{{ t('page.announcements.scheduledAt') }}</dt><dd>{{ formatDate(selected.scheduled_at) }}</dd></div>
          <div><dt>{{ t('page.announcements.publishedAt') }}</dt><dd>{{ formatDate(selected.published_at) }}</dd></div>
        </dl>
      </section>
    </div>

    <UModal v-model:open="previewOpen" :title="t('page.announcements.previewTitle')" :description="t('page.announcements.previewDescription')">
      <template #body>
        <article v-if="previewSnapshot" class="announcement-preview-card" data-testid="announcement-preview-content">
          <p class="gp-secondary">{{ formatDate(previewSnapshot.generated_at) }} · {{ previewSnapshot.audience_summary }}</p>
          <h2 class="gp-card-title">{{ previewSnapshot.title }}</h2>
          <p class="gp-body">{{ previewSnapshot.body }}</p>
          <p class="gp-secondary">{{ t('page.announcements.previewSafety') }}</p>
        </article>
      </template>
    </UModal>

    <UModal v-model:open="confirmOpen" :title="confirmableAction.title" :description="confirmableAction.body">
      <template #footer>
        <UButton color="neutral" variant="outline" @click="confirmOpen = false; pendingAction = null">{{ t('page.announcements.cancel') }}</UButton>
        <UButton :color="pendingAction === 'withdraw' ? 'error' : 'primary'" data-testid="announcement-confirm" @click="applyAction">{{ confirmableAction.submit }}</UButton>
      </template>
    </UModal>

    <UModal v-model:open="discardOpen" :title="t('page.announcements.discardTitle')" :description="t('page.announcements.discardDescription')">
      <template #footer>
        <UButton color="neutral" variant="outline" @click="cancelDiscard">{{ t('page.announcements.keepEditing') }}</UButton>
        <UButton color="error" data-testid="announcement-discard-confirm" @click="confirmDiscardAndContinue">{{ t('page.announcements.discard') }}</UButton>
      </template>
    </UModal>
  </section>
</template>

<style scoped>
.announcement-feedback { border-color: var(--gp-success-fg); }
.announcement-error { border-color: var(--gp-danger-bg); color: var(--gp-danger-fg); }
.announcement-layout { display: grid; grid-template-columns: minmax(250px, .85fr) minmax(0, 2fr); gap: var(--gp-section-gap); align-items: start; }
.announcement-panel-heading, .announcement-editor-heading, .announcement-section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--gp-space-3); }
.announcement-toolbar { display: grid; gap: var(--gp-space-2); margin-top: var(--gp-space-3); }
.announcement-list { list-style: none; display: grid; gap: var(--gp-space-2); padding: 0; margin: var(--gp-space-3) 0 0; }
.announcement-list-item { inline-size: 100%; display: grid; gap: var(--gp-space-1); text-align: start; border: 1px solid var(--gp-border-default); border-radius: var(--gp-radius-control); padding: var(--gp-space-3); background: var(--gp-surface-default); color: inherit; cursor: pointer; }
.announcement-list-item:hover, .announcement-list-item--selected { background: var(--gp-primary-subtle); border-color: var(--gp-primary); }
.announcement-list-item:focus-visible { outline: 2px solid var(--gp-primary-focus); outline-offset: 2px; }
.announcement-list-item__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--gp-space-2); }
.announcement-empty { padding: var(--gp-space-6); text-align: center; color: var(--gp-text-secondary); }
.announcement-editor { display: grid; gap: var(--gp-space-4); min-width: 0; }
.announcement-readonly-notice { margin: 0; padding: var(--gp-space-3); border-radius: var(--gp-radius-control); background: var(--gp-warning-bg); color: var(--gp-warning-fg); }
.announcement-form, .announcement-audience, .announcement-schedule { display: grid; gap: var(--gp-space-3); }
.announcement-audience { padding: var(--gp-space-3); border: 1px solid var(--gp-border-default); border-radius: var(--gp-radius-control); }
.announcement-audience-all, .announcement-audience-option { display: flex; align-items: center; gap: var(--gp-space-2); }
.announcement-audience-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gp-space-4); }
.announcement-audience-grid fieldset { display: grid; gap: var(--gp-space-2); min-width: 0; margin: 0; padding: 0; border: 0; }
.announcement-audience-grid legend { margin-bottom: var(--gp-space-2); font-weight: 600; }
.announcement-audience-summary { margin: 0; padding: var(--gp-space-2); border-radius: var(--gp-radius-control); background: var(--gp-page-bg); }
.announcement-snapshot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--gp-space-2); padding: var(--gp-space-3); border-radius: var(--gp-radius-control); background: var(--gp-primary-subtle); }
.announcement-actions { display: flex; flex-wrap: wrap; gap: var(--gp-space-2); }
.announcement-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gp-space-2); margin: 0; padding-top: var(--gp-space-3); border-top: 1px solid var(--gp-border-default); }
.announcement-facts > div { display: flex; justify-content: space-between; gap: var(--gp-space-2); }
.announcement-facts dt { color: var(--gp-text-secondary); }
.announcement-facts dd { margin: 0; text-align: end; }
.announcement-preview-card { display: grid; gap: var(--gp-space-3); }
.announcement-preview-card h2, .announcement-preview-card p { margin: 0; }
@media (max-width: 959px) { .announcement-layout { grid-template-columns: 1fr; } }
@media (max-width: 639px) { .announcement-audience-grid, .announcement-facts { grid-template-columns: 1fr; } }
</style>
