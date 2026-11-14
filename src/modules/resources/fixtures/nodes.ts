export type NodeStatus = 'online' | 'maintenance' | 'offline'

export interface NodeFixture {
  id: string
  name: string
  region: string
  status: NodeStatus
  gpu: string
  memory: string
  updatedAt: string
}

export const nodeStatusTone: Record<NodeStatus, 'success' | 'warning' | 'danger'> = {
  online: 'success',
  maintenance: 'warning',
  offline: 'danger',
}

export const nodeFixtures: NodeFixture[] = [
  { id: 'node-01', name: 'node-01', region: 'cn-east-1', status: 'online', gpu: '8 × A100 80GB', memory: '640 GB', updatedAt: '09:42' },
  { id: 'node-02', name: 'node-02', region: 'cn-east-1', status: 'online', gpu: '8 × A100 80GB', memory: '640 GB', updatedAt: '09:40' },
  { id: 'node-03', name: 'node-03', region: 'cn-north-1', status: 'online', gpu: '4 × H800 80GB', memory: '320 GB', updatedAt: '09:38' },
  { id: 'node-04', name: 'node-04', region: 'cn-south-1', status: 'maintenance', gpu: '4 × H800 80GB', memory: '320 GB', updatedAt: '09:15' },
  { id: 'node-05', name: 'node-05', region: 'us-west-1', status: 'offline', gpu: '2 × L40S 48GB', memory: '96 GB', updatedAt: '08:52' },
]
