import { z } from 'zod'

export const sessionIdSchema = z.string().regex(/^demo_[0-9a-f-]{36}$/)

export const sessionResponseSchema = z.object({
  id: sessionIdSchema,
  createdAt: z.string().datetime(),
  resetAt: z.string().datetime(),
})

export type SessionResponse = z.infer<typeof sessionResponseSchema>
