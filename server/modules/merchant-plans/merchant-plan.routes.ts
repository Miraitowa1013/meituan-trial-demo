import { Hono } from 'hono'
import { ZodError } from 'zod'
import { saveDraftSchema } from './merchant-plan.schema'
import {
  MerchantPlanNotEditableError,
  MerchantPlanNotFoundError,
  MerchantPlanStoreNotFoundError,
  MerchantPlanUnauthorizedError,
  ObjectivePromiseRequiredError,
  type MerchantPlanService,
} from './merchant-plan.service'

export function createMerchantPlanRoutes(service: MerchantPlanService) {
  const sessionId = (context: { req: { header: (name: string) => string | undefined } }) =>
    context.req.header('x-demo-session')

  return new Hono()
    .get('/stores/:storeId/plans/workbench', async (context) =>
      context.json(await service.workbench(sessionId(context), context.req.param('storeId'))))
    .post('/stores/:storeId/plans/draft', async (context) =>
      context.json(await service.createDraft(sessionId(context), context.req.param('storeId')), 201))
    .put('/stores/:storeId/plans/:planId', async (context) =>
      context.json(await service.saveDraft(
        sessionId(context),
        context.req.param('storeId'),
        context.req.param('planId'),
        saveDraftSchema.parse(await context.req.json()),
      )))
    .post('/stores/:storeId/plans/:planId/publish', async (context) =>
      context.json(await service.publish(
        sessionId(context),
        context.req.param('storeId'),
        context.req.param('planId'),
      )))
    .onError((error, context) => {
      if (error instanceof MerchantPlanUnauthorizedError) {
        return context.json({ code: 'DEMO_SESSION_REQUIRED' }, 401)
      }
      if (error instanceof MerchantPlanStoreNotFoundError) {
        return context.json({ code: 'STORE_NOT_FOUND' }, 404)
      }
      if (error instanceof MerchantPlanNotFoundError) {
        return context.json({ code: 'PLAN_NOT_FOUND' }, 404)
      }
      if (error instanceof MerchantPlanNotEditableError) {
        return context.json({ code: 'PLAN_NOT_EDITABLE' }, 409)
      }
      if (error instanceof ObjectivePromiseRequiredError) {
        return context.json({ code: 'OBJECTIVE_PROMISE_REQUIRED' }, 400)
      }
      if (error instanceof ZodError) {
        return context.json({ code: 'INVALID_PLAN', issues: error.issues }, 400)
      }
      throw error
    })
}
