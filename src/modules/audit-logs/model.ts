import type { AuditChange, AuditEventFixture, AuditResult } from './fixtures/audit-events'

export function getAuditEvent(events: AuditEventFixture[], eventId: string): AuditEventFixture | undefined {
  return events.find((event) => event.event_id === eventId)
}

export function filterAuditEvents(
  events: AuditEventFixture[],
  options: { search?: string; result?: AuditResult | 'all'; action?: string | 'all'; from?: string; to?: string },
): AuditEventFixture[] {
  const query = options.search?.trim().toLowerCase() ?? ''
  const from = options.from ? new Date(`${options.from}T00:00:00Z`).getTime() : Number.NEGATIVE_INFINITY
  const to = options.to ? new Date(`${options.to}T23:59:59Z`).getTime() : Number.POSITIVE_INFINITY
  return events.filter((event) => {
    const occurred = new Date(event.occurred_at).getTime()
    const matchesSearch = !query || `${event.actor_name} ${event.action} ${event.resource_name} ${event.request_id}`.toLowerCase().includes(query)
    return matchesSearch
      && (!options.result || options.result === 'all' || event.result === options.result)
      && (!options.action || options.action === 'all' || event.action === options.action)
      && occurred >= from
      && occurred <= to
  })
}

export function relatedAuditEvents(events: AuditEventFixture[], event: AuditEventFixture): AuditEventFixture[] {
  const ids = new Set(event.related_event_ids)
  return events.filter((candidate) => candidate.event_id !== event.event_id && (ids.has(candidate.event_id) || candidate.request_id === event.request_id))
}

export function displayAuditChange(change: AuditChange): string {
  if (change.masked) return '[已脱敏]'
  return `${change.before ?? '∅'} → ${change.after ?? '∅'}`
}

export function auditEventHref(eventId: string): string {
  return `/audit/logs/${encodeURIComponent(eventId)}`
}
