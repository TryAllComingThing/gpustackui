<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import EmptyState from '../../../components/feedback/EmptyState.vue'
import { getAuditEventDetail, type AuditEventDetailResponse } from '../../../api/audit-logs'
import { formatApiError } from '../../../services/http'
import { auditEventHref, displayAuditChange } from '../model'

const { t, locale } = useI18n()
const route = useRoute()
const copyFeedback = ref('')
const loading = ref(false)
const error = ref('')
const detail = ref<AuditEventDetailResponse | null>(null)

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value))
}

const eventId = computed(() => String(route.params.eventId ?? ''))
const event = computed(() => detail.value?.event ?? null)
const related = computed(() => detail.value?.related_events ?? [])

async function loadDetail() {
  if (!eventId.value) return
  loading.value = true
  error.value = ''
  copyFeedback.value = ''
  const result = await getAuditEventDetail(eventId.value)
  loading.value = false
  if (!result.ok) {
    detail.value = null
    error.value = formatApiError(result.error, t('page.auditLogs.detailLoadFailed'))
    return
  }
  detail.value = result.data
}

watch(eventId, () => { void loadDetail() }, { immediate: true })

async function copyRequestId() {
  if (!event.value) return
  try {
    await navigator.clipboard.writeText(event.value.request_id)
    copyFeedback.value = t('page.auditLogs.copied')
  } catch {
    copyFeedback.value = t('page.auditLogs.copyFailed')
  }
}
</script>

<template>
  <section class="gp-page" data-testid="production-audit-detail">
    <header class="gp-page-header">
      <div>
        <p class="gp-secondary">{{ t('nav.security') }}</p>
        <h1 class="gp-page-title">{{ t('page.auditLogs.detailTitle') }}</h1>
        <p class="gp-secondary">{{ t('page.auditLogs.detailSubtitle') }}</p>
      </div>
      <UButton to="/audit/logs" color="neutral" variant="outline" icon="i-lucide-arrow-left">{{ t('page.auditLogs.backToList') }}</UButton>
    </header>

    <p v-if="loading" class="gp-card" role="status">{{ t('page.auditLogs.detailLoading') }}</p>
    <p v-else-if="error" class="gp-card audit-error" role="alert" data-testid="audit-detail-error">{{ error }}</p>
    <EmptyState v-else-if="!event" :title="t('page.auditLogs.notFoundTitle')" :description="t('page.auditLogs.notFoundBody')" />

    <template v-else>
      <div class="gp-card audit-detail-card">
        <div class="audit-detail-heading">
          <div>
            <p class="gp-secondary">{{ event.event_id }} · {{ event.request_id }}</p>
            <h2 class="gp-card-title">{{ event.action }}</h2>
            <p class="gp-secondary">{{ event.resource_type }} · {{ event.resource_name }}</p>
          </div>
          <span class="gp-badge" :class="event.result === 'success' ? 'gp-badge--success' : 'gp-badge--danger'">{{ t(`page.auditLogs.${event.result}`) }}</span>
        </div>

        <dl class="audit-facts">
          <div><dt>{{ t('page.auditLogs.time') }}</dt><dd>{{ formatDate(event.occurred_at) }}</dd></div>
          <div><dt>{{ t('page.auditLogs.actor') }}</dt><dd>{{ event.actor_name }} ({{ event.actor_id }})</dd></div>
          <div><dt>{{ t('page.auditLogs.resource') }}</dt><dd>{{ event.resource_type }} / {{ event.resource_id }}</dd></div>
          <div><dt>{{ t('page.auditLogs.sourceIp') }}</dt><dd>{{ event.source_ip }}</dd></div>
          <div><dt>{{ t('page.auditLogs.userAgent') }}</dt><dd>{{ event.user_agent }}</dd></div>
        </dl>

        <div class="audit-request-id">
          <span>{{ t('page.auditLogs.requestId') }}: <code data-testid="audit-request-id">{{ event.request_id }}</code></span>
          <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-copy" @click="copyRequestId">{{ t('page.auditLogs.copyRequestId') }}</UButton>
          <span v-if="copyFeedback" class="gp-secondary" role="status" data-testid="audit-copy-feedback">{{ copyFeedback }}</span>
        </div>
      </div>

      <div class="gp-card">
        <h2 class="gp-card-title">{{ t('page.auditLogs.changesTitle') }}</h2>
        <p class="gp-secondary">{{ t('page.auditLogs.changesHint') }}</p>
        <ul class="audit-changes">
          <li v-for="(change, index) in event.changes" :key="`${change.field}-${index}`" class="audit-change-row">
            <strong>{{ change.field }}</strong>
            <code>{{ displayAuditChange(change) }}</code>
            <span v-if="change.masked" class="gp-badge gp-badge--warning">{{ t('page.auditLogs.masked') }}</span>
          </li>
        </ul>
      </div>

      <div class="gp-card">
        <h2 class="gp-card-title">{{ t('page.auditLogs.relatedTitle') }}</h2>
        <p v-if="related.length === 0" class="gp-secondary">{{ t('page.auditLogs.relatedEmpty') }}</p>
        <ul v-else class="audit-related-list">
          <li v-for="item in related" :key="item.event_id">
            <RouterLink :to="auditEventHref(item.event_id)" class="audit-related-link">
              <span>{{ item.action }}</span>
              <span class="gp-secondary">{{ formatDate(item.occurred_at) }} · {{ item.request_id }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>

      <div class="gp-card audit-readonly-footer" role="note">
        <strong>{{ t('page.auditLogs.boundaryTitle') }}</strong>
        <p>{{ t('page.auditLogs.detailBoundaryBody') }}</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.audit-detail-card { display: grid; gap: var(--gp-space-4); }
.audit-error { border-color: var(--gp-danger-bg); color: var(--gp-danger-fg); }
.audit-detail-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--gp-space-3); }
.audit-detail-heading h2, .audit-detail-heading p { margin: 0; }
.audit-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gp-space-3); margin: 0; }
.audit-facts > div { display: grid; grid-template-columns: minmax(90px, .6fr) minmax(0, 1.4fr); gap: var(--gp-space-2); padding-block-end: var(--gp-space-2); border-bottom: 1px solid var(--gp-border-default); }
.audit-facts dt { color: var(--gp-text-secondary); }
.audit-facts dd { margin: 0; overflow-wrap: anywhere; }
.audit-request-id { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gp-space-2); }
.audit-request-id code { padding: 2px 6px; border-radius: var(--gp-radius-tag); background: var(--gp-primary-subtle); }
.audit-changes { list-style: none; display: grid; gap: var(--gp-space-2); padding: 0; margin: var(--gp-space-3) 0 0; }
.audit-change-row { display: grid; grid-template-columns: minmax(120px, .7fr) minmax(0, 1.5fr) auto; align-items: center; gap: var(--gp-space-2); padding: var(--gp-space-3); border: 1px solid var(--gp-border-default); border-radius: var(--gp-radius-control); }
.audit-change-row code { overflow-wrap: anywhere; }
.audit-related-list { list-style: none; display: grid; gap: var(--gp-space-2); padding: 0; margin: var(--gp-space-3) 0 0; }
.audit-related-link { display: grid; gap: var(--gp-space-1); padding: var(--gp-space-3); border: 1px solid var(--gp-border-default); border-radius: var(--gp-radius-control); color: inherit; text-decoration: none; }
.audit-related-link:hover { background: var(--gp-primary-subtle); }
.audit-related-link:focus-visible { outline: 2px solid var(--gp-primary-focus); outline-offset: 2px; }
.audit-readonly-footer { display: grid; gap: var(--gp-space-1); }
.audit-readonly-footer p { margin: 0; color: var(--gp-text-secondary); }
@media (max-width: 639px) { .audit-facts, .audit-change-row { grid-template-columns: 1fr; } }
</style>
