import { Hono } from 'hono'
import { ZodError } from 'zod'
import { submitVerificationSchema } from './verification.schema'
import {
  VerificationConflictError,
  VerificationNotFoundError,
  VerificationUnauthorizedError,
  type VerificationService,
} from './verification.service'

export function createVerificationRoutes(service: VerificationService) {
  return new Hono()
    .post('/:id/verification', async (context) => context.json(await service.submit(
      context.req.header('x-demo-session'),
      context.req.param('id'),
      submitVerificationSchema.parse(await context.req.json()),
    ), 201))
    .onError((error, context) => {
      if (error instanceof ZodError) return context.json({ code: 'INVALID_VERIFICATION', issues: error.issues }, 400)
      if (error instanceof VerificationUnauthorizedError) return context.json({ code: 'DEMO_SESSION_REQUIRED' }, 401)
      if (error instanceof VerificationNotFoundError) return context.json({ code: 'ORDER_NOT_FOUND' }, 404)
      if (error instanceof VerificationConflictError) return context.json({ code: 'VERIFICATION_CONFLICT', message: error.message }, 409)
      throw error
    })
}
