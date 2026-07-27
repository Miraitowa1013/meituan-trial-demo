import { and, asc, eq } from 'drizzle-orm'
import type { AppDatabase } from '../../db/client'
import {
  evidenceAggregates,
  evidenceRecords,
  menuItems,
  stores,
  trialPlanClaims,
  trialPlans,
} from '../../db/schema'
import { buildEvidenceSummary } from '../evidence/summary'
import type { StoreQuery } from './store.schema'
import { getStoreDecisionProfile } from './store-decision-profile'

export class StoreNotFoundError extends Error {}

const mealCategories: Record<NonNullable<StoreQuery['mealPeriod']>, string[]> = {
  breakfast: ['面食', '粥品', '甜品', '饮品'],
  lunch: ['盖饭', '汤饭', '面食', '轻食', '地方菜'],
  dinner: ['盖饭', '汤饭', '面食', '地方菜', '烧烤'],
  lateNight: ['面食', '粥品', '地方菜', '烧烤'],
}

export function createStoreService(db: AppDatabase) {
  return {
    async list(query: StoreQuery) {
      const allStores = await db.select().from(stores).orderBy(asc(stores.distanceMeters))
      const allMenuItems = await db.select().from(menuItems)
      const allEvidence = await db.select().from(evidenceAggregates)
      const categories = [...new Set(allStores.map((store) => store.category))]
      const term = query.q?.toLocaleLowerCase('zh-CN')
      let items = allStores.map((store) => ({
        ...store,
        fromPrice: Math.min(...allMenuItems.filter((item) => item.storeId === store.id).map((item) => item.price)),
      })).filter((store) => {
        if (term && !`${store.name} ${store.heroDish} ${store.category}`.toLocaleLowerCase('zh-CN').includes(term)) return false
        if (query.mealPeriod && !mealCategories[query.mealPeriod].includes(store.category)) return false
        if (query.category && store.category !== query.category) return false
        if (query.maxPrice && store.fromPrice > query.maxPrice) return false
        if (query.maxDistance && store.distanceMeters > query.maxDistance) return false
        if (query.evidenceState && store.evidenceState !== query.evidenceState) return false
        return true
      })
      if (query.sort === 'price') items = items.sort((a, b) => a.averagePrice - b.averagePrice)
      if (query.sort === 'distance') items = items.sort((a, b) => a.distanceMeters - b.distanceMeters)
      if (query.sort === 'evidence') items = items.sort((a, b) => {
        const count = (storeId: string) => allEvidence.filter((evidence) => evidence.storeId === storeId)
          .reduce((sum, evidence) => sum + evidence.positiveCount + evidence.neutralCount + evidence.negativeCount, 0)
        return count(b.id) - count(a.id)
      })
      return { items, facets: { categories }, total: items.length, dataNotice: '店铺与业务指标为匿名沙盒数据' }
    },

    async detail(id: string) {
      const store = await db.query.stores.findFirst({ where: eq(stores.id, id) })
      if (!store) throw new StoreNotFoundError(id)
      const [menu, plan, evidence, records] = await Promise.all([
        db.select().from(menuItems).where(eq(menuItems.storeId, id)),
        db.query.trialPlans.findFirst({
          where: and(eq(trialPlans.storeId, id), eq(trialPlans.status, 'published')),
        }),
        db.select().from(evidenceAggregates).where(eq(evidenceAggregates.storeId, id)),
        db.select().from(evidenceRecords).where(eq(evidenceRecords.storeId, id)),
      ])
      const claims = plan
        ? await db.select().from(trialPlanClaims).where(eq(trialPlanClaims.planId, plan.id)).orderBy(asc(trialPlanClaims.sortOrder))
        : []
      const fromPrice = Math.min(...menu.map((item) => item.price))
      return {
        ...store,
        fromPrice,
        menu,
        trialPlan: plan,
        currentPlan: plan ? { ...plan, claims } : null,
        evidence,
        evidenceSummary: buildEvidenceSummary(evidence, records),
        decisionProfile: getStoreDecisionProfile(id),
        specifications: id === 'store-beef-01' ? [{ label: '牛肉规格', value: '商家标称 80g', source: 'merchant' as const }] : [],
        dataNotice: '公开证据与沙盒业务数据分层展示',
      }
    },
  }
}

export type StoreService = ReturnType<typeof createStoreService>
