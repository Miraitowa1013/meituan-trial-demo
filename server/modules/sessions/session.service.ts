import { randomUUID } from 'node:crypto'
import { and, eq, inArray, ne } from 'drizzle-orm'
import type { AppDatabase } from '../../db/client'
import {
  demoSessions,
  evidenceAggregates,
  evidenceRecords,
  orders,
  stores,
  trialPlanClaims,
  trialPlans,
} from '../../db/schema'
import { seedStores } from '../../db/seed-data'
import type { SessionResponse } from './session.schema'

function toResponse(row: typeof demoSessions.$inferSelect): SessionResponse {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    resetAt: row.resetAt.toISOString(),
  }
}

export class SessionNotFoundError extends Error {}

export function createSessionService(db: AppDatabase) {
  return {
    async create(): Promise<SessionResponse> {
      const now = new Date()
      const row = { id: `demo_${randomUUID()}`, createdAt: now, resetAt: now }
      await db.insert(demoSessions).values(row)
      return toResponse(row)
    },

    async get(id: string): Promise<SessionResponse> {
      const row = await db.query.demoSessions.findFirst({ where: eq(demoSessions.id, id) })
      if (!row) throw new SessionNotFoundError(id)
      return toResponse(row)
    },

    async reset(id: string) {
      const existing = await db.query.demoSessions.findFirst({ where: eq(demoSessions.id, id) })
      if (!existing) throw new SessionNotFoundError(id)
      const resetAt = new Date()
      await db.transaction(async (transaction) => {
        const sessionOrders = await transaction.select({ id: orders.id }).from(orders).where(eq(orders.sessionId, id))
        if (sessionOrders.length) await transaction.delete(evidenceRecords).where(inArray(evidenceRecords.orderId, sessionOrders.map((order) => order.id)))
        await transaction.delete(orders).where(eq(orders.sessionId, id))
        for (const store of seedStores) {
          const existingStore = await transaction.query.stores.findFirst({
            where: eq(stores.id, store.id),
          })
          if (!existingStore) continue
          const versionOnePlan = await transaction.query.trialPlans.findFirst({
            where: and(
              eq(trialPlans.storeId, store.id),
              eq(trialPlans.version, 1),
            ),
          })
          const basePlanId = versionOnePlan?.id ?? store.trialPlan.id
          if (!versionOnePlan) {
            await transaction.insert(trialPlans).values({
              ...store.trialPlan,
              storeId: store.id,
            })
          }
          await transaction.delete(trialPlans).where(and(
            eq(trialPlans.storeId, store.id),
            ne(trialPlans.id, basePlanId),
          ))
          await transaction.update(trialPlans).set({
            menuItemId: store.trialPlan.menuItemId,
            title: store.trialPlan.title,
            benefitLabel: store.trialPlan.benefitLabel,
            dailyQuota: store.trialPlan.dailyQuota,
            remainingQuota: store.trialPlan.remainingQuota,
            trialPrice: store.trialPlan.trialPrice,
            version: store.trialPlan.version,
            status: store.trialPlan.status,
            publishedAt: store.trialPlan.publishedAt,
          }).where(eq(trialPlans.id, basePlanId))
          if (store.trialPlanClaims.length) {
            for (const claim of store.trialPlanClaims) {
              await transaction.insert(trialPlanClaims).values({
                ...claim,
                planId: basePlanId,
              }).onConflictDoUpdate({
                target: trialPlanClaims.id,
                set: {
                  planId: basePlanId,
                  kind: claim.kind,
                  content: claim.content,
                  sourceText: claim.sourceText,
                  decision: claim.decision,
                  sortOrder: claim.sortOrder,
                },
              })
            }
          }
          for (const evidence of store.evidence) {
            await transaction.update(evidenceAggregates).set({
              positiveCount: evidence.positiveCount,
              neutralCount: evidence.neutralCount,
              negativeCount: evidence.negativeCount,
              disputedCount: evidence.disputedCount,
              updatedAt: new Date('2026-07-22T12:40:00+08:00'),
            }).where(eq(evidenceAggregates.id, evidence.id))
          }
        }
        await transaction.update(demoSessions).set({ resetAt }).where(eq(demoSessions.id, id))
      })
      return { id, reset: true as const, resetAt: resetAt.toISOString() }
    },
  }
}

export type SessionService = ReturnType<typeof createSessionService>
