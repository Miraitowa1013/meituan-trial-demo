import { z } from 'zod'

export const storeQuerySchema = z.object({
  q: z.string().trim().max(50).optional(),
  mealPeriod: z.enum(['breakfast', 'lunch', 'dinner', 'lateNight']).optional(),
  category: z.string().trim().max(30).optional(),
  maxPrice: z.coerce.number().positive().max(500).optional(),
  maxDistance: z.coerce.number().int().positive().max(20_000).optional(),
  evidenceState: z.enum(['growing', 'established', 'disputed']).optional(),
  sort: z.enum(['recommended', 'distance', 'price', 'evidence']).default('recommended'),
})

export type StoreQuery = z.infer<typeof storeQuerySchema>
