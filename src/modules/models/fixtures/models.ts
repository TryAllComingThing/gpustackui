export type ModelStatus = 'ready' | 'pending' | 'failed'

export interface ModelFixture {
  id: string
  name: string
  provider: string
  status: ModelStatus
  updatedAt: string
}

export const modelStatusTone: Record<ModelStatus, 'success' | 'warning' | 'danger'> = {
  ready: 'success',
  pending: 'warning',
  failed: 'danger',
}

export const modelFixtures: ModelFixture[] = [
  { id: 'model-01', name: 'Llama 3.1 8B', provider: 'Meta', status: 'ready', updatedAt: '09:40' },
  { id: 'model-02', name: 'Qwen 2.5 72B', provider: 'Alibaba Cloud', status: 'ready', updatedAt: '09:32' },
  { id: 'model-03', name: 'Mistral Large 2', provider: 'Mistral AI', status: 'pending', updatedAt: '09:20' },
  { id: 'model-04', name: 'Gemma 2 27B', provider: 'Google', status: 'ready', updatedAt: '08:55' },
  { id: 'model-05', name: 'DeepSeek V3', provider: 'DeepSeek', status: 'ready', updatedAt: '08:31' },
  { id: 'model-06', name: 'Phi-4 14B', provider: 'Microsoft', status: 'failed', updatedAt: '07:48' },
]
