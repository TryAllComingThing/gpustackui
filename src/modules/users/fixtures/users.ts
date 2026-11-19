import type { AdminUser, UserRoleBinding as AdminUserRoleBinding } from '../../../types/admin'

export type UserRoleBinding = AdminUserRoleBinding
export type UserFixture = AdminUser

export const roleOptions = [
  { label: '租户管理员', value: 'role_tenant_admin' },
  { label: '机构管理员', value: 'role_org_admin' },
  { label: '审计员', value: 'role_auditor' },
  { label: '只读管理员', value: 'role_readonly' },
  { label: '内容编辑', value: 'role_content_editor' },
]

export const organizationOptions = [
  { label: '集团总部', value: 'org_hq' },
  { label: '平台研发部', value: 'org_platform' },
  { label: '前端工程组', value: 'org_platform_frontend' },
  { label: '基础设施组', value: 'org_platform_infra' },
  { label: '运营中心', value: 'org_operations' },
  { label: '内容运营组', value: 'org_operations_content' },
  { label: '财务部', value: 'org_finance' },
]

export const userFixtures: UserFixture[] = [
  {
    id: 'user_admin', username: 'admin', display_name: '系统管理员', email: 'admin@example.com',
    organization_id: 'org_hq', organization_name: '集团总部', status: 'active', source: 'local',
    roles: [{ role_id: 'role_tenant_admin', role_name: '租户管理员', scope: 'all' }],
    effective_permissions: ['iam:*', 'system:dictionary:*', 'content:announcement:*', 'audit:log:*'], permissions_version: 18,
    last_login_at: '2026-11-15T02:40:00Z', updated_at: '2026-11-14T08:00:00Z', version: 6,
    is_self: true, is_last_tenant_admin: true,
  },
  {
    id: 'user_zhang', username: 'zhang.li', display_name: '李明', email: 'zhang.li@example.com',
    organization_id: 'org_platform', organization_name: '平台研发部', status: 'active', source: 'local',
    roles: [{ role_id: 'role_org_admin', role_name: '机构管理员', scope: 'org_subtree' }],
    effective_permissions: ['iam:organization:read', 'iam:organization:update', 'iam:user:read', 'iam:user:update'], permissions_version: 9,
    last_login_at: '2026-11-15T01:25:00Z', updated_at: '2026-11-13T07:20:00Z', version: 4,
    is_self: false, is_last_tenant_admin: false,
  },
  {
    id: 'user_wang', username: 'wang.fang', display_name: '王芳', email: 'wang.fang@example.com',
    organization_id: 'org_platform_frontend', organization_name: '前端工程组', status: 'active', source: 'local',
    roles: [{ role_id: 'role_content_editor', role_name: '内容编辑', scope: 'org' }],
    effective_permissions: ['content:announcement:read', 'content:announcement:create', 'content:announcement:update', 'content:announcement:publish'], permissions_version: 6,
    last_login_at: '2026-11-14T10:10:00Z', updated_at: '2026-11-12T04:00:00Z', version: 3,
    is_self: false, is_last_tenant_admin: false,
  },
  {
    id: 'user_chen', username: 'chen.audit', display_name: '陈审', email: 'chen.audit@example.com',
    organization_id: 'org_operations', organization_name: '运营中心', status: 'active', source: 'local',
    roles: [{ role_id: 'role_auditor', role_name: '审计员', scope: 'org_subtree' }],
    effective_permissions: ['audit:log:read', 'audit:log:detail'], permissions_version: 4,
    last_login_at: '2026-11-15T03:15:00Z', updated_at: '2026-11-11T05:40:00Z', version: 2,
    is_self: false, is_last_tenant_admin: false,
  },
  {
    id: 'user_zhou', username: 'zhou.viewer', display_name: '周阅', email: 'zhou.viewer@example.com',
    organization_id: 'org_finance', organization_name: '财务部', status: 'active', source: 'local',
    roles: [{ role_id: 'role_readonly', role_name: '只读管理员', scope: 'org' }],
    effective_permissions: ['iam:organization:read', 'iam:user:read', 'iam:role:read', 'system:dictionary:read', 'content:announcement:read'], permissions_version: 3,
    last_login_at: '2026-11-09T08:30:00Z', updated_at: '2026-11-08T09:00:00Z', version: 2,
    is_self: false, is_last_tenant_admin: false,
  },
  {
    id: 'user_liu', username: 'liu.yang', display_name: '杨柳', email: 'liu.yang@example.com',
    organization_id: 'org_platform_infra', organization_name: '基础设施组', status: 'active', source: 'sso',
    roles: [{ role_id: 'role_readonly', role_name: '只读管理员', scope: 'org_subtree' }],
    effective_permissions: ['iam:organization:read', 'iam:user:read', 'iam:role:read', 'system:dictionary:read', 'content:announcement:read'], permissions_version: 2,
    last_login_at: '2026-11-14T06:45:00Z', updated_at: '2026-11-10T02:15:00Z', version: 1,
    is_self: false, is_last_tenant_admin: false,
  },
  {
    id: 'user_sun', username: 'sun.ming', display_name: '孙明', email: 'sun.ming@example.com',
    organization_id: 'org_operations_content', organization_name: '内容运营组', status: 'inactive', source: 'local',
    roles: [{ role_id: 'role_content_editor', role_name: '内容编辑', scope: 'org' }],
    effective_permissions: [], permissions_version: 7,
    last_login_at: '2026-10-30T09:00:00Z', updated_at: '2026-11-01T01:00:00Z', version: 3,
    is_self: false, is_last_tenant_admin: false,
  },
]
