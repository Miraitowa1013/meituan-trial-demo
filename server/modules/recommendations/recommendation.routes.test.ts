import { randomUUID } from 'node:crypto'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { Hono } from 'hono'
import { afterEach, describe, expect, it } from 'vitest'
import { createDatabase } from '../../db/client'
import { seedDatabase } from '../../db/seed'
import { createRecommendationRoutes } from './recommendation.routes'
import { createRecommendationService } from './recommendation.service'

const closers: Array<() => Promise<void>> = []
afterEach(async () => Promise.all(closers.splice(0).map((close) => close())))

async function createTestApp() {
  const database = createDatabase(`file:./data/recommendation-test-${randomUUID()}.db`)
  await migrate(database.db, { migrationsFolder: './drizzle' })
  await seedDatabase(database.db)
  closers.push(async () => { database.client.close() })
  return new Hono().route(
    '/api/recommendations',
    createRecommendationRoutes(createRecommendationService(database.db)),
  )
}

describe('POST /api/recommendations', () => {
  it('returns one primary choice and two meaningfully different alternatives', async () => {
    const app = await createTestApp()
    const response = await app.request('/api/recommendations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        budgetMax: 25,
        category: '牛肉饭',
        taste: ['偏清淡'],
        fulfillmentNeeds: ['汤与米饭使用独立密封容器'],
      }),
    })

    expect(response.status).toBe(200)
    const body = await response.json() as {
      items: Array<{
        role: string
        store: { id: string }
        tradeoff: string
        reasons: string[]
        risks: string[]
      }>
    }

    expect(body.items).toHaveLength(3)
    expect(body.items.map((item) => item.role)).toEqual(['primary', 'alternative', 'alternative'])
    expect(body.items.map((item) => item.store.id)).toEqual([
      'store-beef-01',
      'store-beef-02',
      'store-chicken-01',
    ])
    expect(new Set(body.items.map((item) => item.tradeoff)).size).toBe(3)
    expect(body.items.every((item) => item.reasons.length > 0 && item.risks.length > 0)).toBe(true)
  })

  it('rejects a malformed recommendation request', async () => {
    const app = await createTestApp()
    const response = await app.request('/api/recommendations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ budgetMax: -1 }),
    })

    expect(response.status).toBe(400)
  })
})
