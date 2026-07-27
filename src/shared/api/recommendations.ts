import { z } from 'zod'
import { apiRequest } from './http'

export const recommendationDemandSchema = z.object({
  budgetMax: z.number().positive().nullable(),
  category: z.string().nullable(),
  taste: z.array(z.string()),
  fulfillmentNeeds: z.array(z.string()),
})

const recommendationItemSchema = z.object({
  role: z.enum(['primary', 'alternative']),
  store: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    category: z.string(),
    heroDish: z.string(),
    heroImage: z.string(),
    distanceMeters: z.number(),
    deliveryMinutes: z.number(),
    averagePrice: z.number(),
    fromPrice: z.number(),
    evidenceState: z.enum(['growing', 'established', 'disputed']),
    depth: z.enum(['deep', 'browse']),
    sandbox: z.boolean(),
  }),
  evidence: z.object({
    validOrders: z.number(),
    objectivePositive: z.number(),
    objectiveTotal: z.number(),
  }),
  decisionLabel: z.string(),
  tradeoff: z.string(),
  reasons: z.array(z.string()),
  risks: z.array(z.string()),
})

const recommendationResponseSchema = z.object({
  items: z.array(recommendationItemSchema).max(3),
  dataNotice: z.string(),
})

export type RecommendationDemand = z.infer<typeof recommendationDemandSchema>
export type RecommendationItem = z.infer<typeof recommendationItemSchema>

export async function getRecommendations(demand: RecommendationDemand) {
  return recommendationResponseSchema.parse(await apiRequest('/recommendations', {
    method: 'POST',
    body: JSON.stringify(demand),
  }))
}
