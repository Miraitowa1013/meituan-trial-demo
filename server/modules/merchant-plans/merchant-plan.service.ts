import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq } from 'drizzle-orm'
import type { AppDatabase } from '../../db/client'
import { stores, trialPlanClaims, trialPlans } from '../../db/schema'
import type { SaveDraftInput } from './merchant-plan.schema'

export class MerchantPlanUnauthorizedError extends Error {}
export class MerchantPlanStoreNotFoundError extends Error {}
export class MerchantPlanNotFoundError extends Error {}
export class MerchantPlanNotEditableError extends Error {}
export class ObjectivePromiseRequiredError extends Error {}

function requireSession(sessionId: string | undefined) {
  if (!sessionId) throw new MerchantPlanUnauthorizedError()
}

export function createMerchantPlanService(db: AppDatabase) {
  async function requireStore(storeId: string) {
    const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.id, storeId)).limit(1)
    if (!store) throw new MerchantPlanStoreNotFoundError()
  }

  async function claimsFor(planId: string) {
    return db
      .select()
      .from(trialPlanClaims)
      .where(eq(trialPlanClaims.planId, planId))
      .orderBy(asc(trialPlanClaims.sortOrder))
  }

  async function hydrate<T extends typeof trialPlans.$inferSelect>(plan: T | undefined) {
    return plan ? { ...plan, claims: await claimsFor(plan.id) } : null
  }

  return {
    async workbench(sessionId: string | undefined, storeId: string) {
      requireSession(sessionId)
      await requireStore(storeId)
      const plans = await db
        .select()
        .from(trialPlans)
        .where(eq(trialPlans.storeId, storeId))
        .orderBy(desc(trialPlans.version))
      const active = plans.find((plan) => plan.status === 'published')
      const draft = plans.find((plan) => plan.status === 'draft')
      return {
        active: await hydrate(active),
        draft: await hydrate(draft),
        history: plans
          .filter((plan) => plan.status === 'archived')
          .map((plan) => ({ id: plan.id, version: plan.version, status: plan.status, publishedAt: plan.publishedAt })),
      }
    },

    async createDraft(sessionId: string | undefined, storeId: string) {
      requireSession(sessionId)
      await requireStore(storeId)
      const [existingDraft] = await db
        .select()
        .from(trialPlans)
        .where(and(eq(trialPlans.storeId, storeId), eq(trialPlans.status, 'draft')))
        .limit(1)
      if (existingDraft) return hydrate(existingDraft)

      const [active] = await db
        .select()
        .from(trialPlans)
        .where(and(eq(trialPlans.storeId, storeId), eq(trialPlans.status, 'published')))
        .orderBy(desc(trialPlans.version))
        .limit(1)
      if (!active) throw new MerchantPlanNotFoundError()
      const sourceClaims = await claimsFor(active.id)
      const draftId = `${storeId}-plan-v${active.version + 1}-${randomUUID().slice(0, 8)}`

      await db.transaction(async (transaction) => {
        await transaction.insert(trialPlans).values({
          ...active,
          id: draftId,
          version: active.version + 1,
          status: 'draft',
          publishedAt: null,
        })
        if (sourceClaims.length) {
          await transaction.insert(trialPlanClaims).values(sourceClaims.map((claim) => ({
            ...claim,
            id: randomUUID(),
            planId: draftId,
          })))
        }
      })

      const [draft] = await db.select().from(trialPlans).where(eq(trialPlans.id, draftId)).limit(1)
      return hydrate(draft)
    },

    async saveDraft(
      sessionId: string | undefined,
      storeId: string,
      planId: string,
      input: SaveDraftInput,
    ) {
      requireSession(sessionId)
      const [plan] = await db
        .select()
        .from(trialPlans)
        .where(and(eq(trialPlans.id, planId), eq(trialPlans.storeId, storeId)))
        .limit(1)
      if (!plan) throw new MerchantPlanNotFoundError()
      if (plan.status !== 'draft') throw new MerchantPlanNotEditableError()

      await db.transaction(async (transaction) => {
        await transaction.update(trialPlans).set({
          benefitLabel: input.benefitLabel,
          dailyQuota: input.dailyQuota,
          remainingQuota: Math.min(plan.remainingQuota, input.dailyQuota),
          trialPrice: input.trialPrice,
        }).where(eq(trialPlans.id, planId))
        await transaction.delete(trialPlanClaims).where(eq(trialPlanClaims.planId, planId))
        if (input.claims.length) {
          await transaction.insert(trialPlanClaims).values(input.claims.map((claim) => ({
            ...claim,
            id: randomUUID(),
            planId,
          })))
        }
      })

      const [saved] = await db.select().from(trialPlans).where(eq(trialPlans.id, planId)).limit(1)
      return hydrate(saved)
    },

    async publish(sessionId: string | undefined, storeId: string, planId: string) {
      requireSession(sessionId)
      const [plan] = await db
        .select()
        .from(trialPlans)
        .where(and(eq(trialPlans.id, planId), eq(trialPlans.storeId, storeId)))
        .limit(1)
      if (!plan) throw new MerchantPlanNotFoundError()
      if (plan.status !== 'draft') throw new MerchantPlanNotEditableError()
      const claims = await claimsFor(planId)
      const hasObjective = claims.some((claim) =>
        claim.kind === 'objective' && (claim.decision === 'confirmed' || claim.decision === 'modified'))
      if (!hasObjective) throw new ObjectivePromiseRequiredError()

      const publishedAt = new Date()
      await db.transaction(async (transaction) => {
        await transaction
          .update(trialPlans)
          .set({ status: 'archived' })
          .where(and(eq(trialPlans.storeId, storeId), eq(trialPlans.status, 'published')))
        await transaction
          .update(trialPlans)
          .set({ status: 'published', publishedAt })
          .where(eq(trialPlans.id, planId))
      })

      const [published] = await db.select().from(trialPlans).where(eq(trialPlans.id, planId)).limit(1)
      return hydrate(published)
    },
  }
}

export type MerchantPlanService = ReturnType<typeof createMerchantPlanService>
