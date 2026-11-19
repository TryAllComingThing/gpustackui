import type { AnnouncementAudience, AnnouncementFixture, AnnouncementPreviewSnapshot, AnnouncementStatus } from './fixtures/announcements'

export type AnnouncementAction = 'edit' | 'publish' | 'schedule' | 'withdraw' | 'duplicate' | 'preview'

export function availableAnnouncementActions(status: AnnouncementStatus): AnnouncementAction[] {
  if (status === 'draft') return ['edit', 'preview', 'publish', 'schedule']
  if (status === 'scheduled') return ['preview', 'withdraw']
  if (status === 'published') return ['preview', 'withdraw', 'duplicate']
  return ['preview', 'duplicate']
}

export function isAnnouncementEditable(status: AnnouncementStatus): boolean {
  return status === 'draft'
}

export function canTransitionAnnouncement(from: AnnouncementStatus, to: AnnouncementStatus): boolean {
  if (from === 'draft' && (to === 'scheduled' || to === 'published')) return true
  if (from === 'scheduled' && (to === 'published' || to === 'withdrawn' || to === 'expired')) return true
  if (from === 'published' && (to === 'withdrawn' || to === 'expired')) return true
  return false
}

export function filterAnnouncements(
  announcements: AnnouncementFixture[],
  options: { search?: string; status?: AnnouncementStatus | 'all' },
): AnnouncementFixture[] {
  const search = options.search?.trim().toLowerCase() ?? ''
  return announcements.filter((announcement) => {
    const matchesSearch = !search || `${announcement.title} ${announcement.body} ${announcement.author}`.toLowerCase().includes(search)
    const matchesStatus = !options.status || options.status === 'all' || announcement.status === options.status
    return matchesSearch && matchesStatus
  })
}

export function createAnnouncementPreview(
  announcement: AnnouncementFixture,
  audienceSummary: string,
  generatedAt = new Date().toISOString(),
): AnnouncementPreviewSnapshot {
  return { generated_at: generatedAt, title: announcement.title, body: announcement.body, audience_summary: audienceSummary }
}

export function duplicateAnnouncement(announcement: AnnouncementFixture, id: string, nameSuffix: string, timestamp = new Date().toISOString()): AnnouncementFixture {
  return {
    ...announcement,
    id,
    title: `${announcement.title}${nameSuffix}`,
    audience: copyAudience(announcement.audience),
    status: 'draft',
    scheduled_at: null,
    published_at: null,
    created_at: timestamp,
    updated_at: timestamp,
    version: 1,
    preview_snapshot: null,
  }
}

export function copyAudience(audience: AnnouncementAudience): AnnouncementAudience {
  return { all: audience.all, organization_ids: [...audience.organization_ids], role_codes: [...audience.role_codes] }
}

export function normalizeAnnouncementAudience(audience: AnnouncementAudience): AnnouncementAudience {
  return audience.all
    ? { all: true, organization_ids: [], role_codes: [] }
    : copyAudience({ ...audience, all: false })
}

export function isAnnouncementAudienceEmpty(audience: AnnouncementAudience): boolean {
  const normalized = normalizeAnnouncementAudience(audience)
  return !normalized.all && normalized.organization_ids.length === 0 && normalized.role_codes.length === 0
}

export function validateAnnouncementContent(
  input: Pick<AnnouncementFixture, 'title' | 'body' | 'audience'>,
  options: { requireBodyAndAudience?: boolean } = {},
): { ok: true } | { ok: false; reason: 'titleRequired' | 'bodyRequired' | 'audienceRequired' } {
  if (!input.title.trim()) return { ok: false, reason: 'titleRequired' }
  if (options.requireBodyAndAudience && !input.body.trim()) return { ok: false, reason: 'bodyRequired' }
  if (options.requireBodyAndAudience && isAnnouncementAudienceEmpty(input.audience)) return { ok: false, reason: 'audienceRequired' }
  return { ok: true }
}

export function validateAnnouncementSchedule(
  value: string,
  now = new Date(),
): { ok: true; date: Date } | { ok: false; reason: 'invalidSchedule' | 'pastSchedule' } {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return { ok: false, reason: 'invalidSchedule' }
  if (date.getTime() <= now.getTime()) return { ok: false, reason: 'pastSchedule' }
  return { ok: true, date }
}

export function toDateTimeLocalInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localTime.toISOString().slice(0, 16)
}

export function estimatedAudienceCount(audience: AnnouncementAudience): number {
  if (audience.all) return 124
  return Math.min(124, audience.organization_ids.length * 14 + audience.role_codes.length * 9)
}
