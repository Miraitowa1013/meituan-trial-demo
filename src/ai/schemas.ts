import { z } from 'zod'

const needSchema = z.object({
  maxBudget: z.number().positive().nullable(),
  preferredCategories: z.array(z.string()).max(5),
  taste: z.enum(['light', 'balanced', 'rich']).nullable(),
  fulfillmentNeeds: z.array(z.string()).max(8),
})

const responseSchema = z.object({
  need: needSchema,
  citedStoreIds: z.array(z.string()),
})

export function parseNeedResponse(input: unknown, allowedStoreIds: string[]) {
  const parsed = responseSchema.parse(input)
  if (parsed.citedStoreIds.some((id) => !allowedStoreIds.includes(id))) {
    throw new Error('AI response cited a store outside the provided dataset')
  }
  return parsed
}
