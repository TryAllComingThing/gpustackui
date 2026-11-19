export const ADMIN_STATUSES = ['active', 'inactive'] as const
export type AdminStatus = typeof ADMIN_STATUSES[number]

export const DATA_SCOPES = ['self', 'org', 'org_subtree', 'all'] as const
export type DataScope = typeof DATA_SCOPES[number]

export interface AdminPagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface AdminListResponse<T> {
  items: T[]
  pagination: AdminPagination
}

export interface UserRoleBinding {
  role_id: string
  role_name: string
  scope: DataScope
}

export interface AdminUser {
  id: string
  username: string
  display_name: string
  email: string
  organization_id: string
  organization_name: string
  status: AdminStatus
  source: 'local' | 'sso'
  roles: UserRoleBinding[]
  effective_permissions: string[]
  permissions_version: number
  last_login_at: string | null
  updated_at: string
  version: number
  is_self: boolean
  is_last_tenant_admin: boolean
}

export interface PermissionDefinition {
  id: string
  actionKey: string
}

export interface PermissionGroup {
  id: string
  labelKey: string
  permissions: PermissionDefinition[]
}

export interface AdminRole {
  id: string
  code: string
  name: string
  description: string
  builtin: boolean
  status: AdminStatus
  scope: DataScope
  permissions: string[]
  user_count: number
  version: number
  updated_at: string
}

export interface DictionaryType {
  id: string
  code: string
  name: string
  description: string
  entry_count?: number
  status: AdminStatus
  version: number
  updated_at: string
}

export interface DictionaryEntry {
  id: string
  type_id: string
  code: string
  name: string
  description: string
  sort_order: number
  status: AdminStatus
  is_default: boolean
  version: number
  updated_at: string
}

export const ANNOUNCEMENT_STATUSES = ['draft', 'scheduled', 'published', 'withdrawn', 'expired'] as const
export type AnnouncementStatus = typeof ANNOUNCEMENT_STATUSES[number]

export interface AnnouncementAudience {
  all: boolean
  organization_ids: string[]
  role_codes: string[]
}

export interface AnnouncementPreviewSnapshot {
  generated_at: string
  title: string
  body: string
  audience_summary: string
}

export interface AdminAnnouncement {
  id: string
  title: string
  body: string
  status: AnnouncementStatus
  audience: AnnouncementAudience
  author: string
  scheduled_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  version: number
  preview_snapshot: AnnouncementPreviewSnapshot | null
}

export type AuditResult = 'success' | 'failure'

export interface AuditChange {
  field: string
  before: string | null
  after: string | null
  masked?: boolean
}

export interface AuditEvent {
  event_id: string
  occurred_at: string
  actor_id: string
  actor_name: string
  action: string
  resource_type: string
  resource_id: string
  resource_name: string
  result: AuditResult
  request_id: string
  source_ip: string
  user_agent: string
  changes: AuditChange[]
  related_event_ids: string[]
}

export interface AuditActionDefinition {
  labelKey: string
  value: string
}
