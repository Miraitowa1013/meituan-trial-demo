import { z } from 'zod'

export const claimKindSchema = z.enum([
  'objective',
  'preference',
  'specification',
  'unverifiable',
])

export const claimExtractionRequestSchema = z.object({
  text: z.string().trim().min(2).max(500),
})

export const extractedClaimSchema = z.object({
  id: z.string().min(1),
  kind: claimKindSchema,
  content: z.string().min(1),
  sourceText: z.string().min(1),
  rationale: z.string().min(1),
})

export const claimExtractionResponseSchema = z.object({
  source: z.enum(['model', 'fallback']),
  candidates: z.array(extractedClaimSchema).max(8),
})

export type ExtractedClaim = z.infer<typeof extractedClaimSchema>
export type ClaimExtractionResponse = z.infer<typeof claimExtractionResponseSchema>
