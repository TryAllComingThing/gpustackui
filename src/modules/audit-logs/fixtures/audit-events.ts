import type { AuditChange, AuditEvent, AuditResult } from '../../../types/admin'

export type { AuditChange, AuditResult }
export type AuditEventFixture = AuditEvent

export const auditEventFixtures: AuditEventFixture[] = [
  {
    event_id: 'evt_20261115_001', occurred_at: '2026-11-15T03:18:42Z', actor_id: 'user_zhang', actor_name: '李明',
    action: 'organization.status_changed', resource_type: 'organization', resource_id: 'org_platform_infra', resource_name: '基础设施组',
    result: 'success', request_id: 'req_7f5c91a2', source_ip: '10.20.4.18', user_agent: 'Mozilla/5.0 Chrome/131',
    changes: [{ field: 'status', before: 'active', after: 'inactive' }], related_event_ids: ['evt_20261115_002'],
  },
  {
    event_id: 'evt_20261115_002', occurred_at: '2026-11-15T03:18:43Z', actor_id: 'user_zhang', actor_name: '李明',
    action: 'audit.permission_version_incremented', resource_type: 'organization', resource_id: 'org_platform_infra', resource_name: '基础设施组',
    result: 'success', request_id: 'req_7f5c91a2', source_ip: '10.20.4.18', user_agent: 'Mozilla/5.0 Chrome/131',
    changes: [{ field: 'permissions_version', before: '12', after: '13' }], related_event_ids: ['evt_20261115_001'],
  },
  {
    event_id: 'evt_20261115_003', occurred_at: '2026-11-15T02:57:10Z', actor_id: 'user_admin', actor_name: '系统管理员',
    action: 'user.role_assigned', resource_type: 'user', resource_id: 'user_wang', resource_name: '王芳',
    result: 'success', request_id: 'req_91b8e443', source_ip: '10.20.1.6', user_agent: 'Mozilla/5.0 Safari/18.1',
    changes: [{ field: 'roles', before: '只读管理员 · org', after: '内容编辑 · org' }], related_event_ids: [],
  },
  {
    event_id: 'evt_20261115_004', occurred_at: '2026-11-15T02:40:05Z', actor_id: 'user_admin', actor_name: '系统管理员',
    action: 'role.permissions_updated', resource_type: 'role', resource_id: 'role_content_editor', resource_name: '内容编辑',
    result: 'success', request_id: 'req_5adce318', source_ip: '10.20.1.6', user_agent: 'Mozilla/5.0 Safari/18.1',
    changes: [
      { field: 'permissions', before: 'content:announcement:read, update', after: 'content:announcement:read, create, update, publish' },
      { field: 'data_scope', before: 'org_subtree', after: 'org' },
    ], related_event_ids: ['evt_20261115_003'],
  },
  {
    event_id: 'evt_20261115_005', occurred_at: '2026-11-15T02:22:31Z', actor_id: 'user_admin', actor_name: '系统管理员',
    action: 'announcement.published', resource_type: 'announcement', resource_id: 'ann_model_release', resource_name: '模型服务上线公告',
    result: 'success', request_id: 'req_c2ec708d', source_ip: '10.20.1.6', user_agent: 'Mozilla/5.0 Safari/18.1',
    changes: [{ field: 'status', before: 'draft', after: 'published' }], related_event_ids: [],
  },
  {
    event_id: 'evt_20261115_006', occurred_at: '2026-11-15T02:12:18Z', actor_id: 'user_wang', actor_name: '王芳',
    action: 'dictionary.cache_refreshed', resource_type: 'dictionary_type', resource_id: 'dict_task_status', resource_name: '任务状态',
    result: 'success', request_id: 'req_31a0fdd1', source_ip: '10.20.9.32', user_agent: 'Mozilla/5.0 Firefox/133',
    changes: [{ field: 'version', before: '3', after: '4' }], related_event_ids: [],
  },
  {
    event_id: 'evt_20261115_007', occurred_at: '2026-11-15T01:55:44Z', actor_id: 'anonymous', actor_name: '未知用户',
    action: 'auth.login_failed', resource_type: 'session', resource_id: 'session_denied', resource_name: '登录会话',
    result: 'failure', request_id: 'req_ee74d90a', source_ip: '10.20.7.55', user_agent: 'Mozilla/5.0 Chrome/131',
    changes: [{ field: 'credential', before: null, after: '已脱敏', masked: true }], related_event_ids: [],
  },
  {
    event_id: 'evt_20261114_008', occurred_at: '2026-11-14T09:40:12Z', actor_id: 'user_chen', actor_name: '陈审',
    action: 'audit.log_queried', resource_type: 'audit_log', resource_id: 'query_20261114', resource_name: '审计查询',
    result: 'success', request_id: 'req_47f93c1e', source_ip: '10.20.5.12', user_agent: 'Mozilla/5.0 Chrome/131',
    changes: [{ field: 'filters', before: null, after: 'result=success; action=organization.*' }], related_event_ids: [],
  },
]

export const auditActionDefinitions = [
  { labelKey: 'organizationStatusChanged', value: 'organization.status_changed' },
  { labelKey: 'permissionVersionIncremented', value: 'audit.permission_version_incremented' },
  { labelKey: 'userRoleAssigned', value: 'user.role_assigned' },
  { labelKey: 'rolePermissionsUpdated', value: 'role.permissions_updated' },
  { labelKey: 'announcementPublished', value: 'announcement.published' },
  { labelKey: 'dictionaryCacheRefreshed', value: 'dictionary.cache_refreshed' },
  { labelKey: 'loginFailed', value: 'auth.login_failed' },
  { labelKey: 'auditLogQueried', value: 'audit.log_queried' },
]
