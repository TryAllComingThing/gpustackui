import type { DictionaryEntry, DictionaryType } from '../../../types/admin'

export type DictionaryTypeFixture = DictionaryType
export type DictionaryEntryFixture = DictionaryEntry

export const dictionaryTypeFixtures: DictionaryTypeFixture[] = [
  { id: 'dict_task_status', code: 'task_status', name: '任务状态', description: '部署和服务任务的状态值。', status: 'active', version: 3, updated_at: '2026-11-12T03:00:00Z' },
  { id: 'dict_environment', code: 'deployment_environment', name: '部署环境', description: '部署任务可用的环境类型。', status: 'active', version: 2, updated_at: '2026-11-10T04:30:00Z' },
  { id: 'dict_announcement_category', code: 'announcement_category', name: '公告分类', description: '公告编辑器使用的业务分类。', status: 'active', version: 1, updated_at: '2026-11-08T08:00:00Z' },
  { id: 'dict_user_source', code: 'user_source', name: '用户来源', description: '本地账号与 SSO 身份来源。', status: 'inactive', version: 2, updated_at: '2026-11-06T01:20:00Z' },
]

export const dictionaryEntryFixtures: DictionaryEntryFixture[] = [
  { id: 'entry_queued', type_id: 'dict_task_status', code: 'queued', name: '排队中', sort_order: 10, is_default: false, status: 'active', description: '任务已创建，等待调度。', version: 1, updated_at: '2026-11-12T03:00:00Z' },
  { id: 'entry_running', type_id: 'dict_task_status', code: 'running', name: '运行中', sort_order: 20, is_default: true, status: 'active', description: '任务正在执行。', version: 2, updated_at: '2026-11-12T03:00:00Z' },
  { id: 'entry_completed', type_id: 'dict_task_status', code: 'completed', name: '已完成', sort_order: 30, is_default: false, status: 'active', description: '任务成功结束。', version: 1, updated_at: '2026-11-12T03:00:00Z' },
  { id: 'entry_failed', type_id: 'dict_task_status', code: 'failed', name: '失败', sort_order: 40, is_default: false, status: 'active', description: '任务执行失败。', version: 1, updated_at: '2026-11-12T03:00:00Z' },
  { id: 'entry_dev', type_id: 'dict_environment', code: 'development', name: '开发', sort_order: 10, is_default: true, status: 'active', description: '开发环境。', version: 1, updated_at: '2026-11-10T04:30:00Z' },
  { id: 'entry_staging', type_id: 'dict_environment', code: 'staging', name: '预发布', sort_order: 20, is_default: false, status: 'active', description: '预发布验证环境。', version: 1, updated_at: '2026-11-10T04:30:00Z' },
  { id: 'entry_prod', type_id: 'dict_environment', code: 'production', name: '生产', sort_order: 30, is_default: false, status: 'active', description: '生产环境。', version: 1, updated_at: '2026-11-10T04:30:00Z' },
  { id: 'entry_notice', type_id: 'dict_announcement_category', code: 'notice', name: '通知', sort_order: 10, is_default: true, status: 'active', description: '一般通知。', version: 1, updated_at: '2026-11-08T08:00:00Z' },
  { id: 'entry_release', type_id: 'dict_announcement_category', code: 'release', name: '发布说明', sort_order: 20, is_default: false, status: 'active', description: '版本与功能发布说明。', version: 1, updated_at: '2026-11-08T08:00:00Z' },
  { id: 'entry_local', type_id: 'dict_user_source', code: 'local', name: '本地账号', sort_order: 10, is_default: false, status: 'inactive', description: '本地用户名密码账号。', version: 1, updated_at: '2026-11-06T01:20:00Z' },
]
