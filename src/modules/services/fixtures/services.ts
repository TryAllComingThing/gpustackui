export type ServiceStatus = 'running' | 'degraded' | 'stopped'

export interface ServiceFixture {
  id: string
  name: string
  model: string
  replicas: string
  status: ServiceStatus
  updatedAt: string
}

export const serviceStatusTone: Record<ServiceStatus, 'success' | 'warning' | 'neutral'> = {
  running: 'success',
  degraded: 'warning',
  stopped: 'neutral',
}

export const serviceFixtures: ServiceFixture[] = [
  { id: 'service-01', name: 'llama-chat', model: 'Llama 3.1 8B', replicas: '2', status: 'running', updatedAt: '09:41' },
  { id: 'service-02', name: 'qwen-assistant', model: 'Qwen 2.5 72B', replicas: '1', status: 'running', updatedAt: '09:35' },
  { id: 'service-03', name: 'embedding-api', model: 'BGE-M3', replicas: '3', status: 'running', updatedAt: '09:28' },
  { id: 'service-04', name: 'rerank-api', model: 'BGE Reranker', replicas: '1', status: 'degraded', updatedAt: '09:12' },
]
