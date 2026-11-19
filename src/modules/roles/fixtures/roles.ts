import type { AdminRole, PermissionDefinition as AdminPermissionDefinition, PermissionGroup as AdminPermissionGroup } from '../../../types/admin'

export type PermissionDefinition = AdminPermissionDefinition
export type PermissionGroup = AdminPermissionGroup
export type RoleFixture = AdminRole

export const permissionGroups: PermissionGroup[] = [
  {
    id: 'organization',
    labelKey: 'page.roles.resources.organization',
    permissions: [
      { id: 'iam:organization:read', actionKey: 'read' },
      { id: 'iam:organization:create', actionKey: 'create' },
      { id: 'iam:organization:update', actionKey: 'update' },
      { id: 'iam:organization:move', actionKey: 'move' },
      { id: 'iam:organization:update-status', actionKey: 'updateStatus' },
    ],
  },
  {
    id: 'user',
    labelKey: 'page.roles.resources.user',
    permissions: [
      { id: 'iam:user:read', actionKey: 'read' },
      { id: 'iam:user:create', actionKey: 'create' },
      { id: 'iam:user:update', actionKey: 'update' },
      { id: 'iam:user:update-status', actionKey: 'updateStatus' },
      { id: 'iam:user:assign-role', actionKey: 'assignRole' },
      { id: 'iam:user:change-organization', actionKey: 'changeOrganization' },
    ],
  },
  {
    id: 'role',
    labelKey: 'page.roles.resources.role',
    permissions: [
      { id: 'iam:role:read', actionKey: 'read' },
      { id: 'iam:role:create', actionKey: 'create' },
      { id: 'iam:role:update', actionKey: 'update' },
      { id: 'iam:role:update-status', actionKey: 'updateStatus' },
    ],
  },
  {
    id: 'dictionary',
    labelKey: 'page.roles.resources.dictionary',
    permissions: [
      { id: 'system:dictionary:read', actionKey: 'read' },
      { id: 'system:dictionary:create', actionKey: 'create' },
      { id: 'system:dictionary:update', actionKey: 'update' },
      { id: 'system:dictionary:update-status', actionKey: 'updateStatus' },
    ],
  },
  {
    id: 'announcement',
    labelKey: 'page.roles.resources.announcement',
    permissions: [
      { id: 'content:announcement:read', actionKey: 'read' },
      { id: 'content:announcement:create', actionKey: 'create' },
      { id: 'content:announcement:update', actionKey: 'update' },
      { id: 'content:announcement:publish', actionKey: 'publish' },
      { id: 'content:announcement:withdraw', actionKey: 'withdraw' },
    ],
  },
  {
    id: 'audit',
    labelKey: 'page.roles.resources.audit',
    permissions: [
      { id: 'audit:log:read', actionKey: 'read' },
      { id: 'audit:log:detail', actionKey: 'detail' },
    ],
  },
]

export const roleFixtures: RoleFixture[] = [
  {
    id: 'role_tenant_admin',
    code: 'tenant_admin',
    name: '租户管理员',
    description: '管理当前租户的组织、用户、角色、字典、公告与审计查询。',
    builtin: true,
    status: 'active',
    scope: 'all',
    permissions: permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.id)),
    user_count: 1,
    version: 4,
    updated_at: '2026-11-13T08:00:00Z',
  },
  {
    id: 'role_org_admin',
    code: 'org_admin',
    name: '机构管理员',
    description: '管理授权机构子树内的机构和用户。',
    builtin: true,
    status: 'active',
    scope: 'org_subtree',
    permissions: [
      'iam:organization:read', 'iam:organization:update', 'iam:organization:update-status',
      'iam:user:read', 'iam:user:update', 'iam:user:update-status', 'iam:user:assign-role',
    ],
    user_count: 4,
    version: 3,
    updated_at: '2026-11-12T03:20:00Z',
  },
  {
    id: 'role_auditor',
    code: 'auditor',
    name: '审计员',
    description: '查看授权范围内审计日志和事件详情，不执行写操作。',
    builtin: true,
    status: 'active',
    scope: 'org_subtree',
    permissions: ['audit:log:read', 'audit:log:detail'],
    user_count: 2,
    version: 2,
    updated_at: '2026-11-10T09:15:00Z',
  },
  {
    id: 'role_readonly',
    code: 'readonly_admin',
    name: '只读管理员',
    description: '查看授权范围内的管理数据。',
    builtin: true,
    status: 'active',
    scope: 'org_subtree',
    permissions: [
      'iam:organization:read', 'iam:user:read', 'iam:role:read',
      'system:dictionary:read', 'content:announcement:read',
    ],
    user_count: 5,
    version: 1,
    updated_at: '2026-11-08T06:30:00Z',
  },
  {
    id: 'role_content_editor',
    code: 'content_editor',
    name: '内容编辑',
    description: '维护公告草稿并提交发布。',
    builtin: false,
    status: 'active',
    scope: 'org',
    permissions: [
      'content:announcement:read', 'content:announcement:create',
      'content:announcement:update', 'content:announcement:publish',
    ],
    user_count: 3,
    version: 2,
    updated_at: '2026-11-09T05:00:00Z',
  },
]
