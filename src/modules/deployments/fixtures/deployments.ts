export type DeploymentStatus = 'running' | 'queued' | 'completed' | 'failed'

export interface DeploymentFixture {
  id: string
  name: string
  model: string
  target: string
  status: DeploymentStatus
  startedAt: string
}

export const deploymentStatusTone: Record<DeploymentStatus, 'success' | 'warning' | 'neutral' | 'danger'> = {
  running: 'success',
  queued: 'warning',
  completed: 'neutral',
  failed: 'danger',
}

export const deploymentFixtures: DeploymentFixture[] = [
  { id: 'deploy-01', name: 'production-llama', model: 'Llama 3.1 8B', target: '2', status: 'running', startedAt: '08:40' },
  { id: 'deploy-02', name: 'qwen-canary', model: 'Qwen 2.5 72B', target: '1', status: 'queued', startedAt: '09:05' },
  { id: 'deploy-03', name: 'embedding-batch', model: 'BGE-M3', target: '3', status: 'completed', startedAt: '2026-11-08 21:10' },
  { id: 'deploy-04', name: 'legacy-phi', model: 'Phi-3 Mini', target: '1', status: 'failed', startedAt: '2026-11-08 18:25' },
]
