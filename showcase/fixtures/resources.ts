export interface ResourceRow {
  id: string
  name: string
  type: string
  status: string
  utilization: number
  owner: string
  [key: string]: unknown
}

export const resourceRows: ResourceRow[] = [
  { id: 'gpu-a100-01', name: 'GPU-A100-01', type: 'A100', status: '运行中', utilization: 68, owner: '平台组' },
  { id: 'gpu-h800-02', name: 'GPU-H800-02', type: 'H800', status: '维护中', utilization: 0, owner: '模型组' },
  { id: 'gpu-l40s-03', name: 'GPU-L40S-03', type: 'L40S', status: '运行中', utilization: 44, owner: '推理组' },
  { id: 'gpu-a100-04', name: 'GPU-A100-04', type: 'A100', status: '空闲', utilization: 0, owner: '平台组' },
  { id: 'gpu-h800-05', name: 'GPU-H800-05', type: 'H800', status: '运行中', utilization: 82, owner: '训练组' },
  { id: 'gpu-l40s-06', name: 'GPU-L40S-06', type: 'L40S', status: '告警', utilization: 96, owner: '推理组' },
  { id: 'gpu-a100-07', name: 'GPU-A100-07', type: 'A100', status: '运行中', utilization: 57, owner: '模型组' },
  { id: 'gpu-h800-08', name: 'GPU-H800-08', type: 'H800', status: '空闲', utilization: 0, owner: '平台组' },
]
