import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import type { AppDatabase } from './db/client'
import { createSessionRoutes } from './modules/sessions/session.routes'
import { createSessionService } from './modules/sessions/session.service'
import { createOrderRoutes } from './modules/orders/order.routes'
import { createOrderService } from './modules/orders/order.service'
import { createStoreRoutes } from './modules/stores/store.routes'
import { createStoreService } from './modules/stores/store.service'
import { createVerificationRoutes } from './modules/verifications/verification.routes'
import { createVerificationService } from './modules/verifications/verification.service'
import { createMerchantRoutes } from './modules/merchant/merchant.routes'
import { createMerchantService } from './modules/merchant/merchant.service'
import { createDemandRoutes } from './modules/ai/demand.routes'
import { createDemandService } from './modules/ai/demand.service'
import { createClaimExtractionRoutes } from './modules/ai/claim-extraction.routes'
import { createClaimExtractionService } from './modules/ai/claim-extraction.service'
import { serverConfig } from './config'
import { createRecommendationRoutes } from './modules/recommendations/recommendation.routes'
import { createRecommendationService } from './modules/recommendations/recommendation.service'
import { createMerchantPlanRoutes } from './modules/merchant-plans/merchant-plan.routes'
import { createMerchantPlanService } from './modules/merchant-plans/merchant-plan.service'

export function createApp(db: AppDatabase) {
  const app = new Hono()

  app.get('/api/health', async (context) => {
    await db.run(sql`select 1`)
    return context.json({
      status: 'ok',
      database: 'ready',
      service: 'meituan-trial-api',
    })
  })

  app.route('/api/sessions', createSessionRoutes(createSessionService(db)))
  app.route('/api/stores', createStoreRoutes(createStoreService(db)))
  app.route('/api/orders', createOrderRoutes(createOrderService(db)))
  app.route('/api/orders', createVerificationRoutes(createVerificationService(db)))
  app.route('/api/merchant', createMerchantRoutes(createMerchantService(db)))
  app.route('/api/merchant', createMerchantPlanRoutes(createMerchantPlanService(db)))
  app.route('/api/ai', createDemandRoutes(createDemandService({
    provider: serverConfig.llmProvider,
    apiKey: serverConfig.deepseekApiKey,
    baseUrl: serverConfig.aiBaseUrl,
    model: serverConfig.aiModel,
  })))
  app.route('/api/ai', createClaimExtractionRoutes(createClaimExtractionService({
    provider: serverConfig.llmProvider,
    apiKey: serverConfig.deepseekApiKey,
    baseUrl: serverConfig.aiBaseUrl,
    model: serverConfig.aiModel,
  })))
  app.route('/api/recommendations', createRecommendationRoutes(createRecommendationService(db)))

  app.notFound((context) => {
    if (context.req.path.startsWith('/api/')) {
      return context.json({ code: 'API_ROUTE_NOT_FOUND' }, 404)
    }
    return context.text('Not Found', 404)
  })

  app.onError((error, context) => {
    console.error(error)
    return context.json({ code: 'INTERNAL_SERVER_ERROR' }, 500)
  })

  return app
}
