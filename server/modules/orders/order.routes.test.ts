import { randomUUID } from 'node:crypto'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../app'
import { createDatabase } from '../../db/client'
import { seedDatabase } from '../../db/seed'
import { eq } from 'drizzle-orm'
import { trialPlans } from '../../db/schema'
import { createSessionService } from '../sessions/session.service'
import { createMerchantPlanService } from '../merchant-plans/merchant-plan.service'

describe('trial order routes', () => {
  let testDatabase: ReturnType<typeof createDatabase>
  let app: ReturnType<typeof createApp>
  let sessionId: string

  beforeEach(async () => {
    testDatabase = createDatabase(`file:./data/order-test-${randomUUID()}.db`)
    await migrate(testDatabase.db, { migrationsFolder: './drizzle' })
    await seedDatabase(testDatabase.db)
    sessionId = (await createSessionService(testDatabase.db).create()).id
    app = createApp(testDatabase.db)
  })

  afterEach(async () => {
    await testDatabase.client.close()
  })

  it('creates an order with immutable item and promise snapshots', async () => {
    const response = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-demo-session': sessionId },
      body: JSON.stringify({
        storeId: 'store-beef-01',
        items: [{ menuItemId: 'store-beef-01-trial', quantity: 1 }],
      }),
    })

    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({
      status: 'created',
      sandbox: true,
      totalAmount: 23.9,
      items: [{ menuItemId: 'store-beef-01-trial', quantity: 1, unitPrice: 23.9 }],
      promises: expect.arrayContaining([
        expect.objectContaining({ aspect: expect.any(String), version: 1 }),
      ]),
    })
  })

  it('keeps V1 on old orders and locks published V2 into new orders', async () => {
    const createOrder = () => app.request('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-demo-session': sessionId },
      body: JSON.stringify({
        storeId: 'store-beef-01',
        items: [{ menuItemId: 'store-beef-01-trial', quantity: 1 }],
      }),
    })

    const oldOrder = await createOrder()
    const oldBody = await oldOrder.json() as { id: string }
    const merchantPlans = createMerchantPlanService(testDatabase.db)
    const draft = await merchantPlans.createDraft('merchant-session', 'store-beef-01')
    await merchantPlans.saveDraft('merchant-session', 'store-beef-01', draft!.id, {
      benefitLabel: '试新保障',
      dailyQuota: 10,
      trialPrice: 22.9,
      claims: [{
        kind: 'objective',
        content: '汤与主食分别使用独立密封容器',
        sourceText: '汤饭分开装',
        decision: 'modified',
        sortOrder: 1,
      }],
    })
    await merchantPlans.publish('merchant-session', 'store-beef-01', draft!.id)

    const oldDetail = await app.request(`/api/orders/${oldBody.id}`, {
      headers: { 'x-demo-session': sessionId },
    })
    expect(await oldDetail.json()).toMatchObject({
      totalAmount: 23.9,
      promises: expect.arrayContaining([
        expect.objectContaining({
          version: 1,
          aspect: '汤与米饭使用独立密封容器',
          kind: 'objective',
        }),
      ]),
    })

    const newOrder = await createOrder()
    expect(await newOrder.json()).toMatchObject({
      totalAmount: 22.9,
      items: [{ unitPrice: 22.9 }],
      promises: expect.arrayContaining([
        expect.objectContaining({
          version: 2,
          aspect: '汤与主食分别使用独立密封容器',
          kind: 'objective',
        }),
      ]),
    })
  })

  it('requires a valid demo session', async () => {
    const response = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ storeId: 'store-beef-01', items: [{ menuItemId: 'store-beef-01-trial', quantity: 1 }] }),
    })
    expect(response.status).toBe(401)
  })

  it('does not sell more trial orders than the remaining quota', async () => {
    await testDatabase.db
      .update(trialPlans)
      .set({ remainingQuota: 1 })
      .where(eq(trialPlans.id, 'store-beef-01-plan-v1'))
    const createOrder = () => app.request('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-demo-session': sessionId },
      body: JSON.stringify({
        storeId: 'store-beef-01',
        items: [{ menuItemId: 'store-beef-01-trial', quantity: 1 }],
      }),
    })
    const responses = await Promise.all([createOrder(), createOrder()])
    expect(responses.map((response) => response.status).sort()).toEqual([201, 400])
  })

  it('rejects an empty cart and an item owned by another store', async () => {
    const empty = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-demo-session': sessionId },
      body: JSON.stringify({ storeId: 'store-beef-01', items: [] }),
    })
    expect(empty.status).toBe(400)

    const foreignItem = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-demo-session': sessionId },
      body: JSON.stringify({ storeId: 'store-beef-01', items: [{ menuItemId: 'store-chicken-01-trial', quantity: 1 }] }),
    })
    expect(foreignItem.status).toBe(400)
  })

  it('isolates order lists and advances only through the demo state machine', async () => {
    const otherSessionId = (await createSessionService(testDatabase.db).create()).id
    const createdResponse = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-demo-session': sessionId },
      body: JSON.stringify({ storeId: 'store-beef-01', items: [{ menuItemId: 'store-beef-01-trial', quantity: 1 }] }),
    })
    const created = await createdResponse.json() as { id: string }

    const otherList = await app.request('/api/orders', { headers: { 'x-demo-session': otherSessionId } })
    expect((await otherList.json() as { items: unknown[] }).items).toHaveLength(0)

    const statuses: string[] = []
    for (let step = 0; step < 4; step += 1) {
      const advanced = await app.request(`/api/orders/${created.id}/advance`, {
        method: 'POST',
        headers: { 'x-demo-session': sessionId },
      })
      expect(advanced.status).toBe(200)
      statuses.push((await advanced.json() as { status: string }).status)
    }
    expect(statuses).toEqual(['preparing', 'delivering', 'delivered', 'pending_verification'])

    const terminalAdvance = await app.request(`/api/orders/${created.id}/advance`, {
      method: 'POST',
      headers: { 'x-demo-session': sessionId },
    })
    expect(terminalAdvance.status).toBe(409)
  })
})
