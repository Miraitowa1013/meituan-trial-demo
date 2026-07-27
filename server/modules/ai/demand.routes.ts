import { Hono } from 'hono'
import { ZodError } from 'zod'
import { demandRequestSchema } from './demand.schema'
import type { DemandService } from './demand.service'

export function createDemandRoutes(service: DemandService) {
  return new Hono()
    .post('/parse-demand', async (context) => {
      const input = demandRequestSchema.parse(await context.req.json())
      return context.json(await service.parse(input.text))
    })
    .onError((error, context) => {
      if (error instanceof ZodError) {
        return context.json({ code: 'INVALID_DEMAND', issues: error.issues }, 400)
      }
      throw error
    })
}
