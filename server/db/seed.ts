import { eq } from 'drizzle-orm'
import type { AppDatabase } from './client'
import {
  evidenceAggregates,
  evidenceRecords,
  menuItems,
  stores,
  trialPlanClaims,
  trialPlans,
} from './schema'
import { seedStores } from './seed-data'

export async function seedDatabase(db: AppDatabase) {
  const updatedAt = new Date('2026-07-22T12:40:00+08:00')

  await db.transaction(async (transaction) => {
    for (const store of seedStores) {
      await transaction.insert(stores).values({
        id: store.id,
        slug: store.slug,
        name: store.name,
        category: store.category,
        heroDish: store.heroDish,
        heroImage: store.heroImage,
        distanceMeters: store.distanceMeters,
        deliveryMinutes: store.deliveryMinutes,
        averagePrice: store.averagePrice,
        evidenceState: store.evidenceState,
        depth: store.depth,
        sandbox: true,
      }).onConflictDoUpdate({
        target: stores.id,
        set: {
          name: store.name,
          category: store.category,
          heroDish: store.heroDish,
          heroImage: store.heroImage,
          distanceMeters: store.distanceMeters,
          deliveryMinutes: store.deliveryMinutes,
          averagePrice: store.averagePrice,
          evidenceState: store.evidenceState,
          depth: store.depth,
        },
      })

      const existingPlans = await transaction
        .select({ id: trialPlans.id })
        .from(trialPlans)
        .where(eq(trialPlans.storeId, store.id))
      for (const plan of existingPlans) {
        await transaction.delete(trialPlanClaims).where(eq(trialPlanClaims.planId, plan.id))
      }
      await transaction.delete(trialPlans).where(eq(trialPlans.storeId, store.id))
      await transaction.delete(menuItems).where(eq(menuItems.storeId, store.id))
      await transaction.delete(evidenceAggregates).where(eq(evidenceAggregates.storeId, store.id))
      await transaction.delete(evidenceRecords).where(eq(evidenceRecords.storeId, store.id))

      await transaction.insert(menuItems).values(store.menu.map((item) => ({ ...item, storeId: store.id })))
      await transaction.insert(trialPlans).values({ ...store.trialPlan, storeId: store.id })
      await transaction.insert(trialPlanClaims).values(store.trialPlanClaims.map((claim) => ({
        ...claim,
        planId: store.trialPlan.id,
      })))
      await transaction.insert(evidenceAggregates).values(store.evidence.map((item) => ({
        ...item,
        storeId: store.id,
        updatedAt,
      })))
      if (store.evidenceRecords.length) {
        await transaction.insert(evidenceRecords).values(store.evidenceRecords.map((item) => ({
          ...item,
          storeId: store.id,
          sandbox: true,
        })))
      }
    }
  })
}
