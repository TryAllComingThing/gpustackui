import { ANNOUNCEMENT_STATUSES, type AdminAnnouncement, type AnnouncementAudience, type AnnouncementPreviewSnapshot, type AnnouncementStatus } from '../../../types/admin'

export { ANNOUNCEMENT_STATUSES }
export type { AnnouncementAudience, AnnouncementPreviewSnapshot, AnnouncementStatus }
export type AnnouncementFixture = AdminAnnouncement

export const announcementFixtures: AnnouncementFixture[] = [
  {
    id: 'ann_maintenance', title: '十一月平台维护通知',
    body: '平台将于本月第三个周六 02:00 至 04:00 进行维护。维护期间控制台只读，运行中的服务不受影响。',
    status: 'draft',
    audience: { all: false, organization_ids: ['org_platform', 'org_operations'], role_codes: [] }, author: '李明',
    scheduled_at: null, published_at: null, created_at: '2026-11-14T06:20:00Z', updated_at: '2026-11-15T01:30:00Z', version: 3,
    preview_snapshot: null,
  },
  {
    id: 'ann_security_drill', title: '年度安全演练安排',
    body: '请各机构管理员确认演练联系人，并在演练前完成权限复核。演练期间如发现异常，请通过安全值班渠道反馈。',
    status: 'scheduled',
    audience: { all: false, organization_ids: ['org_hq'], role_codes: ['tenant_admin', 'org_admin'] }, author: '陈审',
    scheduled_at: '2026-11-18T01:00:00Z', published_at: null, created_at: '2026-11-12T02:10:00Z', updated_at: '2026-11-14T08:00:00Z', version: 4,
    preview_snapshot: { generated_at: '2026-11-14T07:50:00Z', title: '年度安全演练安排', body: '请各机构管理员确认演练联系人，并在演练前完成权限复核。', audience_summary: '集团总部 · 租户管理员、机构管理员' },
  },
  {
    id: 'ann_model_release', title: '模型服务上线公告',
    body: '模型服务新增批量推理队列和调用配额视图。现有 API 契约保持不变，已有部署无需迁移。',
    status: 'published',
    audience: { all: true, organization_ids: [], role_codes: [] }, author: '王芳',
    scheduled_at: null, published_at: '2026-11-10T03:00:00Z', created_at: '2026-11-09T07:00:00Z', updated_at: '2026-11-10T03:00:00Z', version: 2,
    preview_snapshot: { generated_at: '2026-11-09T08:30:00Z', title: '模型服务上线公告', body: '模型服务新增批量推理队列和调用配额视图。', audience_summary: '全体用户' },
  },
  {
    id: 'ann_billing_withdrawn', title: '旧版计费规则调整',
    body: '因计费方案调整，本次公告已撤回。请以财务部后续发布的通知为准。',
    status: 'withdrawn',
    audience: { all: false, organization_ids: ['org_operations', 'org_finance'], role_codes: [] }, author: '周阅',
    scheduled_at: null, published_at: '2026-11-05T02:00:00Z', created_at: '2026-11-04T01:00:00Z', updated_at: '2026-11-07T06:40:00Z', version: 3,
    preview_snapshot: null,
  },
  {
    id: 'ann_holiday_expired', title: '国庆值班安排',
    body: '国庆期间值班表已结束使用。如仍需查询历史安排，请联系运营中心。',
    status: 'expired',
    audience: { all: false, organization_ids: ['org_operations'], role_codes: ['org_admin'] }, author: '孙明',
    scheduled_at: null, published_at: '2026-09-28T01:00:00Z', created_at: '2026-09-27T05:00:00Z', updated_at: '2026-10-08T01:00:00Z', version: 2,
    preview_snapshot: null,
  },
]

export const audienceOrganizationOptions = [
  { label: '集团总部', value: 'org_hq' },
  { label: '平台研发部', value: 'org_platform' },
  { label: '前端工程组', value: 'org_platform_frontend' },
  { label: '基础设施组', value: 'org_platform_infra' },
  { label: '运营中心', value: 'org_operations' },
  { label: '内容运营组', value: 'org_operations_content' },
  { label: '财务部', value: 'org_finance' },
]

export const audienceRoleOptions = [
  { label: '租户管理员', value: 'tenant_admin' },
  { label: '机构管理员', value: 'org_admin' },
  { label: '审计员', value: 'auditor' },
  { label: '只读管理员', value: 'readonly_admin' },
  { label: '内容编辑', value: 'content_editor' },
]
