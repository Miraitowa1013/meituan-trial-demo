import { Hono } from 'hono'
import { ZodError } from 'zod'
import { storeQuerySchema } from './store.schema'
import { StoreNotFoundError, type StoreService } from './store.service'

export function createStoreRoutes(service: StoreService) {
  return new Hono()
    .get('/', async (context) => context.json(await service.list(storeQuerySchema.parse(context.req.query()))))
    .get('/:id', async (context) => context.json(await service.detail(context.req.param('id'))))
    .onError((error, context) => {
      if (error instanceof ZodError) return context.json({ code: 'INVALID_STORE_QUERY', issues: error.issues }, 400)
      if (error instanceof StoreNotFoundError) return context.json({ code: 'STORE_NOT_FOUND' }, 404)
      throw error
    })
}
