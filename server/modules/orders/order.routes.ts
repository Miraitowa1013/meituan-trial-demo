import { Hono } from 'hono'
import { ZodError } from 'zod'
import { createOrderSchema } from './order.schema'
import {
  OrderInvalidError,
  OrderNotFoundError,
  OrderTransitionError,
  OrderUnauthorizedError,
  type OrderService,
} from './order.service'

export function createOrderRoutes(service: OrderService) {
  const sessionId = (context: { req: { header: (name: string) => string | undefined } }) => context.req.header('x-demo-session')
  return new Hono()
    .post('/', async (context) => context.json(await service.create(sessionId(context), createOrderSchema.parse(await context.req.json())), 201))
    .get('/', async (context) => context.json(await service.list(sessionId(context))))
    .get('/:id', async (context) => context.json(await service.detail(sessionId(context), context.req.param('id'))))
    .post('/:id/advance', async (context) => context.json(await service.advance(sessionId(context), context.req.param('id'))))
    .onError((error, context) => {
      if (error instanceof ZodError || error instanceof OrderInvalidError) return context.json({ code: 'INVALID_ORDER', message: error.message }, 400)
      if (error instanceof OrderUnauthorizedError) return context.json({ code: 'DEMO_SESSION_REQUIRED' }, 401)
      if (error instanceof OrderNotFoundError) return context.json({ code: 'ORDER_NOT_FOUND' }, 404)
      if (error instanceof OrderTransitionError) return context.json({ code: 'ORDER_CANNOT_ADVANCE' }, 409)
      throw error
    })
}
