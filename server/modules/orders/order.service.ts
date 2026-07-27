import { randomUUID } from 'node:crypto'
import { and, asc, eq, gt, inArray, ne, sql } from 'drizzle-orm'
import type { AppDatabase } from '../../db/client'
import {
  demoSessions,
  menuItems,
  orderItems,
  orderPromiseSnapshots,
  orders,
  stores,
  trialPlanClaims,
  trialPlans,
  verificationItems,
  verifications,
} from '../../db/schema'
import type { CreateOrderInput, OrderStatus } from './order.schema'

export class OrderUnauthorizedError extends Error {}
export class OrderInvalidError extends Error {}
export class OrderNotFoundError extends Error {}
export class OrderTransitionError extends Error {}

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  created: 'preparing',
  preparing: 'delivering',
  delivering: 'delivered',
  delivered: 'pending_verification',
}

export function createOrderService(db: AppDatabase) {
  async function requireSession(sessionId?: string) {
    if (!sessionId) throw new OrderUnauthorizedError('Missing demo session')
    const session = await db.query.demoSessions.findFirst({ where: eq(demoSessions.id, sessionId) })
    if (!session) throw new OrderUnauthorizedError('Unknown demo session')
    return sessionId
  }

  async function detailForSession(sessionId: string, orderId: string) {
    const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.sessionId, sessionId)) })
    if (!order) throw new OrderNotFoundError(orderId)
    const [store, items, promises, verification] = await Promise.all([
      db.query.stores.findFirst({ where: eq(stores.id, order.storeId) }),
      db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
      db.select().from(orderPromiseSnapshots).where(eq(orderPromiseSnapshots.orderId, order.id)),
      db.query.verifications.findFirst({ where: eq(verifications.orderId, order.id) }),
    ])
    const submittedItems = verification
      ? await db.select().from(verificationItems).where(eq(verificationItems.verificationId, verification.id))
      : []
    return {
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      store: store ? { id: store.id, name: store.name, heroDish: store.heroDish } : undefined,
      items: items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.nameSnapshot,
        unitPrice: item.unitPriceSnapshot,
        quantity: item.quantity,
      })),
      promises: promises.map((promise) => ({
        id: promise.id,
        planId: promise.planId,
        claimId: promise.claimId,
        kind: promise.kind,
        aspect: promise.aspect,
        version: promise.version,
        merchantConfirmedAt: promise.merchantConfirmedAt.toISOString(),
      })),
      verification: verification ? {
        id: verification.id,
        objectiveResult: verification.objectiveResult,
        tasteResult: verification.tasteResult,
        repurchaseIntent: verification.repurchaseIntent,
        note: verification.note,
        imagePath: verification.imagePath,
        createdAt: verification.createdAt.toISOString(),
        items: submittedItems.map((item) => ({
          promiseSnapshotId: item.promiseSnapshotId,
          result: item.result,
        })),
      } : null,
    }
  }

  return {
    async create(sessionId: string | undefined, input: CreateOrderInput) {
      const validSessionId = await requireSession(sessionId)
      const requestedIds = [...new Set(input.items.map((item) => item.menuItemId))]
      const selectedMenu = await db.select().from(menuItems).where(inArray(menuItems.id, requestedIds))
      if (selectedMenu.length !== requestedIds.length || selectedMenu.some((item) => item.storeId !== input.storeId)) {
        throw new OrderInvalidError('Menu items must belong to the selected store')
      }
      const includesTrialItem = selectedMenu.some((item) => item.isTrial)
      const [activePlan] = includesTrialItem
        ? await db.select().from(trialPlans).where(and(
            eq(trialPlans.storeId, input.storeId),
            eq(trialPlans.status, 'published'),
          )).limit(1)
        : []
      if (includesTrialItem && (!activePlan || activePlan.remainingQuota < 1)) {
        throw new OrderInvalidError('Trial quota unavailable')
      }
      const activeClaims = activePlan
        ? await db.select().from(trialPlanClaims).where(and(
            eq(trialPlanClaims.planId, activePlan.id),
            ne(trialPlanClaims.decision, 'rejected'),
            ne(trialPlanClaims.kind, 'unverifiable'),
          )).orderBy(asc(trialPlanClaims.sortOrder))
        : []
      const quantityById = new Map(input.items.map((item) => [item.menuItemId, item.quantity]))
      const unitPriceFor = (item: typeof selectedMenu[number]) =>
        item.isTrial && activePlan ? activePlan.trialPrice : item.price
      const totalAmount = selectedMenu.reduce(
        (sum, item) => sum + unitPriceFor(item) * (quantityById.get(item.id) ?? 0),
        0,
      )
      const orderId = `order_${randomUUID()}`
      const now = new Date()
      for (let attempt = 0; ; attempt += 1) {
        try {
          await db.transaction(async (transaction) => {
            await transaction.insert(orders).values({
              id: orderId,
              sessionId: validSessionId,
              storeId: input.storeId,
              status: 'created',
              totalAmount,
              sandbox: true,
              createdAt: now,
              updatedAt: now,
            })
            await transaction.insert(orderItems).values(selectedMenu.map((item) => ({
              id: `item_${randomUUID()}`,
              orderId,
              menuItemId: item.id,
              nameSnapshot: item.name,
              unitPriceSnapshot: unitPriceFor(item),
              quantity: quantityById.get(item.id) ?? 1,
            })))
            if (activePlan && activeClaims.length) {
              await transaction.insert(orderPromiseSnapshots).values(activeClaims.map((claim) => ({
                id: `promise_${randomUUID()}`,
                orderId,
                planId: activePlan.id,
                claimId: claim.id,
                kind: claim.kind as 'objective' | 'preference' | 'specification',
                aspect: claim.content,
                version: activePlan.version,
                merchantConfirmedAt: activePlan.publishedAt ?? now,
              })))
            }
            if (activePlan) {
              const quotaUpdate = await transaction
                .update(trialPlans)
                .set({ remainingQuota: sql`${trialPlans.remainingQuota} - 1` })
                .where(and(eq(trialPlans.id, activePlan.id), gt(trialPlans.remainingQuota, 0)))
              if (quotaUpdate.rowsAffected !== 1) {
                throw new OrderInvalidError('Trial quota unavailable')
              }
            }
          })
          break
        } catch (error) {
          const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
          if (code !== 'SQLITE_BUSY' || attempt >= 2) throw error
          await new Promise((resolve) => setTimeout(resolve, 15 * (attempt + 1)))
        }
      }
      return detailForSession(validSessionId, orderId)
    },

    async list(sessionId?: string) {
      const validSessionId = await requireSession(sessionId)
      const rows = await db.select().from(orders).where(eq(orders.sessionId, validSessionId))
      return { items: await Promise.all(rows.map((row) => detailForSession(validSessionId, row.id))) }
    },

    async detail(sessionId: string | undefined, orderId: string) {
      const validSessionId = await requireSession(sessionId)
      return detailForSession(validSessionId, orderId)
    },

    async advance(sessionId: string | undefined, orderId: string) {
      const validSessionId = await requireSession(sessionId)
      const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.sessionId, validSessionId)) })
      if (!order) throw new OrderNotFoundError(orderId)
      const status = nextStatus[order.status]
      if (!status) throw new OrderTransitionError(order.status)
      await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, order.id))
      return detailForSession(validSessionId, order.id)
    },
  }
}

export type OrderService = ReturnType<typeof createOrderService>
