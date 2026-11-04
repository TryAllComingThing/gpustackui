import { z } from 'zod'

export const AuthUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  is_admin: z.boolean(),
  is_active: z.boolean().optional(),
  full_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  require_password_change: z.boolean().optional(),
  is_system: z.boolean().optional(),
  role: z.string().nullable().optional(),
  cluster_id: z.number().nullable().optional(),
  worker_id: z.number().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type AuthUser = z.infer<typeof AuthUserSchema>
