import { z } from 'zod'
import { claimKindSchema } from '../ai/claim-extraction.schema'

export const saveDraftSchema = z.object({
  benefitLabel: z.string().trim().min(1).max(40),
  dailyQuota: z.number().int().min(1).max(100),
  trialPrice: z.number().positive().max(999),
  claims: z.array(z.object({
    kind: claimKindSchema,
    content: z.string().trim().min(1).max(80),
    sourceText: z.string().trim().min(1).max(160),
    decision: z.enum(['confirmed', 'modified', 'rejected']),
    sortOrder: z.number().int().nonnegative(),
  })).max(8),
})

export type SaveDraftInput = z.infer<typeof saveDraftSchema>
