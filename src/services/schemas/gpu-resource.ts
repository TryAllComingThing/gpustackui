import { z } from 'zod'

export const GpuResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  model: z.string(),
  status: z.string(),
  utilization: z.string(),
})

export type GpuResource = z.infer<typeof GpuResourceSchema>
