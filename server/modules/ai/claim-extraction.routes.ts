import { Hono } from 'hono'
import { ZodError } from 'zod'
import { claimExtractionRequestSchema } from './claim-extraction.schema'
import type { ClaimExtractionService } from './claim-extraction.service'

export function createClaimExtractionRoutes(service: ClaimExtractionService) {
  return new Hono()
    .post('/extract-claims', async (context) => {
      const input = claimExtractionRequestSchema.parse(await context.req.json())
      return context.json(await service.extract(input.text))
    })
    .onError((error, context) => {
      if (error instanceof ZodError) {
        return context.json({ code: 'INVALID_MERCHANT_COPY', issues: error.issues }, 400)
      }
      throw error
    })
}
