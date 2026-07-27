import { randomUUID } from 'node:crypto'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDatabase } from '../../db/client'
import { seedDatabase } from '../../db/seed'
import { createMerchantPlanRoutes } from './merchant-plan.routes'
import { createMerchantPlanService } from './merchant-plan.service'

describe('merchant plan publication workflow', () => {
  let close: () => Promise<void>
  let app: Hono

  beforeEach(async () => {
    const database = createDatabase(`file:./data/merchant-plan-test-${randomUUID()}.db`)
    await migrate(database.db, { migrationsFolder: './drizzle' })
    await seedDatabase(database.db)
    close = async () => database.client.close()
    app = new Hono().route(
      '/api/merchant',
      createMerchantPlanRoutes(createMerchantPlanService(database.db)),
    )
  })

  afterEach(async () => close())

  const request = (path: string, init?: RequestInit) => app.request(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-demo-session': 'merchant-demo-session',
      ...init?.headers,
    },
  })

  it('creates, saves and publishes V2 while archiving V1', async () => {
    const workbenchResponse = await request('/api/merchant/stores/store-beef-01/plans/workbench')
    expect(workbenchResponse.status).toBe(200)
    expect(await workbenchResponse.json()).toMatchObject({
      active: { version: 1, status: 'published' },
      draft: null,
    })

    const draftResponse = await request('/api/merchant/stores/store-beef-01/plans/draft', {
      method: 'POST',
      body: '{}',
    })
    expect(draftResponse.status).toBe(201)
    const draft = await draftResponse.json() as { id: string }
    expect(draft).toMatchObject({ version: 2, status: 'draft' })

    const saveResponse = await request(`/api/merchant/stores/store-beef-01/plans/${draft.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        benefitLabel: '试新保障',
        dailyQuota: 10,
        trialPrice: 22.9,
        claims: [
          {
            kind: 'objective',
            content: '汤与米饭使用独立密封容器',
            sourceText: '汤饭分开装',
            decision: 'confirmed',
            sortOrder: 1,
          },
          {
            kind: 'preference',
            content: '支持少油制作',
            sourceText: '可按备注少油',
            decision: 'modified',
            sortOrder: 2,
          },
        ],
      }),
    })
    expect(saveResponse.status).toBe(200)

    const publishResponse = await request(`/api/merchant/stores/store-beef-01/plans/${draft.id}/publish`, {
      method: 'POST',
      body: '{}',
    })
    expect(publishResponse.status).toBe(200)
    expect(await publishResponse.json()).toMatchObject({ version: 2, status: 'published' })

    const finalWorkbench = await request('/api/merchant/stores/store-beef-01/plans/workbench')
    expect(await finalWorkbench.json()).toMatchObject({
      active: { version: 2, status: 'published' },
      draft: null,
      history: expect.arrayContaining([
        expect.objectContaining({ version: 1, status: 'archived' }),
      ]),
    })
  })

  it('requires a demo session for merchant writes', async () => {
    const response = await app.request('/api/merchant/stores/store-beef-01/plans/draft', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ code: 'DEMO_SESSION_REQUIRED' })
  })

  it('refuses to publish a draft without a usable objective promise', async () => {
    const draftResponse = await request('/api/merchant/stores/store-beef-01/plans/draft', {
      method: 'POST',
      body: '{}',
    })
    const draft = await draftResponse.json() as { id: string }

    await request(`/api/merchant/stores/store-beef-01/plans/${draft.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        benefitLabel: '试新保障',
        dailyQuota: 10,
        trialPrice: 22.9,
        claims: [{
          kind: 'unverifiable',
          content: '招牌好吃不踩雷',
          sourceText: '招牌好吃不踩雷',
          decision: 'rejected',
          sortOrder: 1,
        }],
      }),
    })

    const response = await request(`/api/merchant/stores/store-beef-01/plans/${draft.id}/publish`, {
      method: 'POST',
      body: '{}',
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ code: 'OBJECTIVE_PROMISE_REQUIRED' })
  })
})
