import { Hono } from 'hono'
import { ZodError } from 'zod'
import { recommendationRequestSchema } from './recommendation.schema'
import type { RecommendationService } from './recommendation.service'

export function createRecommendationRoutes(service: RecommendationService) {
  return new Hono()
    .post('/', async (context) => {
      const input = recommendationRequestSchema.parse(await context.req.json())
      return context.json(await service.recommend(input))
    })
    .onError((error, context) => {
      if (error instanceof ZodError) {
        return context.json({ code: 'INVALID_RECOMMENDATION_REQUEST', issues: error.issues }, 400)
      }
      throw error
    })
}
