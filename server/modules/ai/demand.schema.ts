import { z } from 'zod'

export const demandRequestSchema = z.object({
  text: z.string().trim().min(2).max(300),
})

export const fulfillmentNeedSchema = z.object({
  raw: z.string().min(1),
  normalized: z.string().min(1),
  responsibleParty: z.enum(['merchant', 'delivery', 'unknown']),
})

export const parsedDemandSchema = z.object({
  budgetMax: z.number().positive().nullable(),
  category: z.string().nullable(),
  taste: z.array(z.string()).max(4),
  fulfillmentNeeds: z.array(fulfillmentNeedSchema).max(6),
  source: z.enum(['model', 'fallback']),
})

export type ParsedDemand = z.infer<typeof parsedDemandSchema>
