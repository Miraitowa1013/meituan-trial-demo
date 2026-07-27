import { z } from 'zod'

export const recommendationRequestSchema = z.object({
  budgetMax: z.number().positive().nullable(),
  category: z.string().nullable(),
  taste: z.array(z.string()).max(4),
  fulfillmentNeeds: z.array(z.string()).max(6),
})

export type RecommendationRequest = z.infer<typeof recommendationRequestSchema>
