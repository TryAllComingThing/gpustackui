export interface ShowcaseUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastActive: string
}

export const showcaseUsers: ShowcaseUser[] = [
  { id: 'user-001', name: '小张', email: 'zhang@example.com', role: '管理员', status: '启用', lastActive: '2026-11-01 09:20' },
  { id: 'user-002', name: '小李', email: 'li@example.com', role: '编辑者', status: '启用', lastActive: '2026-10-31 18:42' },
  { id: 'user-003', name: '小王', email: 'wang@example.com', role: '查看者', status: '停用', lastActive: '2026-10-29 14:08' },
  { id: 'user-004', name: '小赵', email: 'zhao@example.com', role: '编辑者', status: '启用', lastActive: '2026-10-28 11:36' },
  { id: 'user-005', name: '小陈', email: 'chen@example.com', role: '查看者', status: '启用', lastActive: '2026-10-27 08:17' },
  { id: 'user-006', name: '小周', email: 'zhou@example.com', role: '管理员', status: '停用', lastActive: '2026-10-25 16:55' },
]
