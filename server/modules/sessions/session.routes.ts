import { Hono } from 'hono'
import { ZodError } from 'zod'
import { sessionIdSchema } from './session.schema'
import { SessionNotFoundError, type SessionService } from './session.service'

export function createSessionRoutes(service: SessionService) {
  return new Hono()
    .post('/', async (context) => context.json(await service.create(), 201))
    .get('/:id', async (context) => context.json(await service.get(sessionIdSchema.parse(context.req.param('id')))))
    .post('/:id/reset', async (context) => context.json(await service.reset(sessionIdSchema.parse(context.req.param('id')))))
    .onError((error, context) => {
      if (error instanceof ZodError) return context.json({ code: 'INVALID_SESSION_ID' }, 400)
      if (error instanceof SessionNotFoundError) return context.json({ code: 'SESSION_NOT_FOUND' }, 404)
      throw error
    })
}
