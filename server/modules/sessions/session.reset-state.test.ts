import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { expect, it } from 'vitest'
import { createDatabase } from '../../db/client'
import { seedDatabase } from '../../db/seed'
import { evidenceAggregates, orders, trialPlanClaims, trialPlans } from '../../db/schema'
import { createMerchantPlanService } from '../merchant-plans/merchant-plan.service'
import { createOrderService } from '../orders/order.service'
import { createVerificationService } from '../verifications/verification.service'
import { createSessionService } from './session.service'

it('removes session transactions and restores mutated evidence', async () => {
  const database = createDatabase(`file:./data/session-reset-state-${randomUUID()}.db`)
  await migrate(database.db, { migrationsFolder: './drizzle' })
  await seedDatabase(database.db)
  const sessions = createSessionService(database.db)
  const sessionId = (await sessions.create()).id
  const orderService = createOrderService(database.db)
  const order = await orderService.create(sessionId, { storeId: 'store-beef-01', items: [{ menuItemId: 'store-beef-01-trial', quantity: 1 }] })
  for (let step = 0; step < 4; step += 1) await orderService.advance(sessionId, order.id)
  const objective = order.promises.find((promise) => promise.kind === 'objective')!
  await createVerificationService(database.db).submit(sessionId, order.id, {
    objectiveResults: [{ promiseSnapshotId: objective.id, result: 'fulfilled' }],
    tasteResult: 'light',
    repurchaseIntent: 'yes',
  })

  const changed = await database.db.query.evidenceAggregates.findFirst({ where: and(
    eq(evidenceAggregates.storeId, 'store-beef-01'),
    eq(evidenceAggregates.evidenceType, 'objective'),
  ) })
  expect(changed?.positiveCount).toBe(9)

  const merchantPlans = createMerchantPlanService(database.db)
  const draft = await merchantPlans.createDraft(sessionId, 'store-beef-01')
  await merchantPlans.publish(sessionId, 'store-beef-01', draft!.id)
  expect((await database.db.select().from(trialPlans).where(eq(trialPlans.storeId, 'store-beef-01')))
    .some((plan) => plan.version === 2 && plan.status === 'published')).toBe(true)
  await database.db.update(trialPlans).set({
    title: 'broken plan',
    benefitLabel: 'broken benefit',
    trialPrice: 0,
  }).where(eq(trialPlans.id, 'store-beef-01-plan-v1'))
  await database.db.update(trialPlanClaims).set({
    content: 'broken claim',
    decision: 'rejected',
  }).where(eq(trialPlanClaims.planId, 'store-beef-01-plan-v1'))

  await sessions.reset(sessionId)

  expect(await database.db.select().from(orders).where(eq(orders.sessionId, sessionId))).toHaveLength(0)
  const restored = await database.db.query.evidenceAggregates.findFirst({ where: and(
    eq(evidenceAggregates.storeId, 'store-beef-01'),
    eq(evidenceAggregates.evidenceType, 'objective'),
  ) })
  expect(restored?.positiveCount).toBe(8)
  const restoredPlans = await database.db.select().from(trialPlans).where(eq(trialPlans.storeId, 'store-beef-01'))
  expect(restoredPlans).toHaveLength(1)
  expect(restoredPlans[0]).toMatchObject({
    id: 'store-beef-01-plan-v1',
    version: 1,
    status: 'published',
    title: '招牌现切牛肉饭可信试新',
    benefitLabel: '试新保障',
    trialPrice: 23.9,
  })
  const restoredClaims = await database.db.select().from(trialPlanClaims).where(eq(
    trialPlanClaims.planId,
    'store-beef-01-plan-v1',
  ))
  expect(restoredClaims).toHaveLength(4)
  expect(restoredClaims.find((claim) => claim.kind === 'objective')).toMatchObject({
    content: '汤与米饭使用独立密封容器',
    decision: 'confirmed',
  })
  await database.client.close()
})

it('repairs a legacy version-one plan without requiring a fresh database', async () => {
  const database = createDatabase(`file:./data/session-reset-state-${randomUUID()}.db`)
  await migrate(database.db, { migrationsFolder: './drizzle' })
  await seedDatabase(database.db)
  await database.db.delete(trialPlanClaims).where(eq(
    trialPlanClaims.planId,
    'store-beef-01-plan-v1',
  ))
  await database.db.delete(trialPlans).where(eq(trialPlans.id, 'store-beef-01-plan-v1'))
  await database.db.insert(trialPlans).values({
    id: 'store-beef-01-plan',
    storeId: 'store-beef-01',
    menuItemId: 'store-beef-01-trial',
    title: 'legacy plan',
    benefitLabel: 'legacy benefit',
    dailyQuota: 20,
    remainingQuota: 11,
    trialPrice: 0,
    version: 1,
    status: 'published',
    publishedAt: null,
  })

  const sessions = createSessionService(database.db)
  const sessionId = (await sessions.create()).id
  await sessions.reset(sessionId)

  const restoredPlan = await database.db.query.trialPlans.findFirst({
    where: and(
      eq(trialPlans.storeId, 'store-beef-01'),
      eq(trialPlans.version, 1),
    ),
  })
  expect(restoredPlan).toMatchObject({
    id: 'store-beef-01-plan',
    title: '招牌现切牛肉饭可信试新',
    benefitLabel: '试新保障',
    trialPrice: 23.9,
  })
  expect(await database.db.select().from(trialPlanClaims).where(eq(
    trialPlanClaims.planId,
    'store-beef-01-plan',
  ))).toHaveLength(4)
  await database.client.close()
})
