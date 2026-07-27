import { z } from 'zod'
import { apiRequest } from './http'

const parsedDemandSchema = z.object({
  budgetMax: z.number().positive().nullable(),
  category: z.string().nullable(),
  taste: z.array(z.string()),
  fulfillmentNeeds: z.array(z.object({
    raw: z.string(),
    normalized: z.string(),
    responsibleParty: z.enum(['merchant', 'delivery', 'unknown']),
  })),
  source: z.enum(['model', 'fallback']),
})

export type ParsedDemand = z.infer<typeof parsedDemandSchema>

export async function parseDemand(text: string) {
  return parsedDemandSchema.parse(await apiRequest('/ai/parse-demand', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }))
}
