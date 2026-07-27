import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../app'
import { createDatabase } from '../../db/client'
import { seedDatabase } from '../../db/seed'
import { evidenceAggregates, orderPromiseSnapshots, orders, verificationItems } from '../../db/schema'
import { createOrderService } from '../orders/order.service'
import { createSessionService } from '../sessions/session.service'

describe('order verification routes', () => {
  let database: ReturnType<typeof createDatabase>
  let app: ReturnType<typeof createApp>
  let sessionId: string
  let orderId: string
  let objectivePromiseId: string

  beforeEach(async () => {
    database = createDatabase(`file:./data/verification-test-${randomUUID()}.db`)
    await migrate(database.db, { migrationsFolder: './drizzle' })
    await seedDatabase(database.db)
    sessionId = (await createSessionService(database.db).create()).id
    app = createApp(database.db)
    const service = createOrderService(database.db)
    const order = await service.create(sessionId, { storeId: 'store-beef-01', items: [{ menuItemId: 'store-beef-01-trial', quantity: 1 }] })
    orderId = order.id
    objectivePromiseId = order.promises.find((promise) => promise.kind === 'objective')!.id
    for (let step = 0; step < 4; step += 1) await service.advance(sessionId, orderId)
  })

  afterEach(async () => database.client.close())

  async function objectiveAggregate() {
    return database.db.query.evidenceAggregates.findFirst({ where: and(
      eq(evidenceAggregates.storeId, 'store-beef-01'),
      eq(evidenceAggregates.evidenceType, 'objective'),
    ) })
  }

  async function submit(body: Record<string, unknown>) {
    return app.request(`/api/orders/${orderId}/verification`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-demo-session': sessionId },
      body: JSON.stringify(body),
    })
  }

  it('adds a fulfilled result to evidence and completes the order', async () => {
    const before = await objectiveAggregate()
    const response = await submit({
      objectiveResults: [{ promiseSnapshotId: objectivePromiseId, result: 'fulfilled' }],
      tasteResult: 'light',
      repurchaseIntent: 'yes',
    })
    expect(response.status).toBe(201)
    const result = await response.json() as { after: { validOrders:number; objective:{positive:number;total:number}; oilFit:{positive:number;total:number}; repurchase:{positive:number;total:number}; growth:{current:number;threshold:number} } }
    expect(result.after).toMatchObject({validOrders:9,objective:{positive:9,total:9},oilFit:{positive:8,total:9},repurchase:{positive:7,total:9},growth:{current:9,threshold:10}})
    const after = await objectiveAggregate()
    expect(after?.positiveCount).toBe((before?.positiveCount ?? 0) + 1)
    expect(await database.db.select().from(verificationItems)).toContainEqual(expect.objectContaining({
      promiseSnapshotId: objectivePromiseId,
      result: 'fulfilled',
    }))
    expect((await database.db.query.orders.findFirst({ where: eq(orders.id, orderId) }))?.status).toBe('completed')
    const detail = await app.request(`/api/orders/${orderId}`, { headers: { 'x-demo-session': sessionId } })
    expect(await detail.json()).toMatchObject({
      verification: {
        objectiveResult: 'fulfilled',
        tasteResult: 'light',
        repurchaseIntent: 'yes',
        items: [expect.objectContaining({ promiseSnapshotId: objectivePromiseId, result: 'fulfilled' })],
      },
    })
  })

  it('creates a pending dispute without counting an unfulfilled result as negative', async () => {
    const before = await objectiveAggregate()
    const response = await submit({
      objectiveResults: [{ promiseSnapshotId: objectivePromiseId, result: 'unfulfilled' }],
      tasteResult: 'rich',
      repurchaseIntent: 'no',
      note: '没有使用独立密封容器',
      imagePath: null,
    })
    expect(response.status).toBe(201)
    const after = await objectiveAggregate()
    expect(after?.negativeCount).toBe(before?.negativeCount)
    expect(after?.disputedCount).toBe((before?.disputedCount ?? 0) + 1)
    expect((await database.db.query.orders.findFirst({ where: eq(orders.id, orderId) }))?.status).toBe('disputed')
  })

  it('requires evidence for an unfulfilled claim and rejects duplicate submission', async () => {
    const invalid = await submit({
      objectiveResults: [{ promiseSnapshotId: objectivePromiseId, result: 'unfulfilled' }],
      tasteResult: 'balanced',
      repurchaseIntent: 'maybe',
    })
    expect(invalid.status).toBe(400)
    const valid = {
      objectiveResults: [{ promiseSnapshotId: objectivePromiseId, result: 'fulfilled' }],
      tasteResult: 'balanced',
      repurchaseIntent: 'maybe',
    }
    expect((await submit(valid)).status).toBe(201)
    expect((await submit(valid)).status).toBe(409)
  })

  it('rejects a verification that omits an objective promise from the order snapshot', async () => {
    await database.db.insert(orderPromiseSnapshots).values({
      id: 'second-objective',
      orderId,
      planId: 'store-beef-01-plan-v1',
      claimId: 'beef-v1-sealed',
      kind: 'objective',
      aspect: '酱汁独立包装',
      version: 1,
      merchantConfirmedAt: new Date('2026-07-20T10:30:00+08:00'),
    })
    const response = await submit({
      objectiveResults: [{ promiseSnapshotId: objectivePromiseId, result: 'fulfilled' }],
      tasteResult: 'light',
      repurchaseIntent: 'yes',
    })
    expect(response.status).toBe(409)
  })
})
