import { z } from 'zod'
import { requestValidated } from '../../services/http'
import type { Result } from '../../services/http'

export const GPU_DEVICES_PATH = '/gpu-devices'

const UtilizationSchema = z.object({
  total: z.number().nullable().optional(),
  utilization_rate: z.number().nullable().optional(),
})

const MemorySchema = UtilizationSchema.extend({
  is_unified_memory: z.boolean().optional(),
  used: z.number().nullable().optional(),
  allocated: z.number().nullable().optional(),
})

const NetworkSchema = z.object({
  status: z.string().optional(),
  inet: z.string().optional(),
  netmask: z.string().optional(),
  mac: z.string().optional(),
  gateway: z.string().optional(),
  iface: z.string().nullable().optional(),
  mtu: z.number().nullable().optional(),
})

export const GpuDeviceSchema = z.object({
  id: z.string(),
  worker_id: z.number(),
  worker_name: z.string(),
  worker_ip: z.string(),
  worker_ifname: z.string(),
  cluster_id: z.number(),
  name: z.string(),
  vendor: z.string().optional(),
  type: z.string().optional(),
  index: z.number().nullable().optional(),
  device_index: z.number().nullable().optional(),
  device_chip_index: z.number().nullable().optional(),
  arch_family: z.string().nullable().optional(),
  uuid: z.string().nullable().optional(),
  driver_version: z.string().nullable().optional(),
  runtime_version: z.string().nullable().optional(),
  compute_capability: z.string().nullable().optional(),
  core: UtilizationSchema.nullable().optional(),
  memory: MemorySchema.nullable().optional(),
  temperature: z.number().nullable().optional(),
  network: NetworkSchema.nullable().optional(),
})

export const GpuDeviceListSchema = z.object({
  items: z.array(GpuDeviceSchema),
  pagination: z.object({
    page: z.number(),
    perPage: z.number(),
    total: z.number(),
    totalPage: z.number(),
  }),
})

export interface GpuDeviceListParams {
  page?: number
  perPage?: number
  search?: string
  clusterId?: number
  sortBy?: string
}

export type GpuDevice = z.infer<typeof GpuDeviceSchema>
export type GpuDeviceList = z.infer<typeof GpuDeviceListSchema>

export function toGpuDeviceQuery(params: GpuDeviceListParams = {}): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (params.page !== undefined) query.page = params.page
  if (params.perPage !== undefined) query.perPage = params.perPage
  if (params.search) query.search = params.search
  if (params.clusterId !== undefined) query.cluster_id = params.clusterId
  if (params.sortBy) query.sort_by = params.sortBy
  return query
}

export function listGpuDevices(params: GpuDeviceListParams = {}): Promise<Result<GpuDeviceList>> {
  return requestValidated(
    { method: 'GET', url: GPU_DEVICES_PATH, params: toGpuDeviceQuery(params) },
    GpuDeviceListSchema,
  )
}

export function getGpuDevice(id: string): Promise<Result<GpuDevice>> {
  return requestValidated(
    { method: 'GET', url: `${GPU_DEVICES_PATH}/${encodeURIComponent(id)}` },
    GpuDeviceSchema,
  )
}
