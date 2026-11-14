export interface DashboardStat {
  id: 'gpu' | 'nodes' | 'services'
  labelKey: string
  hintKey: string
  value: string
}

export const dashboardStats: DashboardStat[] = [
  { id: 'gpu', labelKey: 'page.dashboard.statGpu', hintKey: 'page.dashboard.statGpuHint', value: '68%' },
  { id: 'nodes', labelKey: 'page.dashboard.statNodes', hintKey: 'page.dashboard.statNodesHint', value: '3' },
  { id: 'services', labelKey: 'page.dashboard.statServices', hintKey: 'page.dashboard.statServicesHint', value: '3' },
]
