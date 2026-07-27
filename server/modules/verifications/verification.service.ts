import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import type { AppDatabase } from '../../db/client'
import {
  demoSessions,
  disputes,
  evidenceAggregates,
  evidenceRecords,
  orderPromiseSnapshots,
  orders,
  verificationItems,
  verifications,
} from '../../db/schema'
import { buildEvidenceSummary } from '../evidence/summary'
import type { SubmitVerificationInput } from './verification.schema'

export class VerificationUnauthorizedError extends Error {}
export class VerificationNotFoundError extends Error {}
export class VerificationConflictError extends Error {}

type AggregateRow = typeof evidenceAggregates.$inferSelect

function increment(row: AggregateRow, bucket: 'positive' | 'neutral' | 'negative' | 'disputed') {
  return {
    positiveCount: row.positiveCount + (bucket === 'positive' ? 1 : 0),
    neutralCount: row.neutralCount + (bucket === 'neutral' ? 1 : 0),
    negativeCount: row.negativeCount + (bucket === 'negative' ? 1 : 0),
    disputedCount: row.disputedCount + (bucket === 'disputed' ? 1 : 0),
    updatedAt: new Date(),
  }
}

export function createVerificationService(db: AppDatabase) {
  return {
    async submit(sessionId: string | undefined, orderId: string, input: SubmitVerificationInput) {
      if (!sessionId) throw new VerificationUnauthorizedError('Missing demo session')
      const session = await db.query.demoSessions.findFirst({ where: eq(demoSessions.id, sessionId) })
      if (!session) throw new VerificationUnauthorizedError('Unknown demo session')
      const order = await db.query.orders.findFirst({ where: and(eq(orders.id, orderId), eq(orders.sessionId, sessionId)) })
      if (!order) throw new VerificationNotFoundError(orderId)
      if (order.status !== 'pending_verification') throw new VerificationConflictError('Order is not ready for verification')
      if (await db.query.verifications.findFirst({ where: eq(verifications.orderId, orderId) })) {
        throw new VerificationConflictError('Order already verified')
      }
      const submittedIds = [...new Set(input.objectiveResults.map((item) => item.promiseSnapshotId))]
      if (submittedIds.length !== input.objectiveResults.length) {
        throw new VerificationConflictError('Duplicate promise result')
      }
      const snapshots = await db
        .select()
        .from(orderPromiseSnapshots)
        .where(eq(orderPromiseSnapshots.orderId, orderId))
      const objectiveSnapshots = snapshots.filter((snapshot) => snapshot.kind === 'objective')
      if (
        objectiveSnapshots.length !== submittedIds.length
        || objectiveSnapshots.some((snapshot) => !submittedIds.includes(snapshot.id))
      ) {
        throw new VerificationConflictError('Every objective promise must be verified exactly once')
      }
      const aggregates = await db.select().from(evidenceAggregates).where(eq(evidenceAggregates.storeId, order.storeId))
      const byType = new Map(aggregates.map((row) => [row.evidenceType, row]))
      const objective = byType.get('objective')
      const subjective = byType.get('subjective')
      const behavioral = byType.get('behavioral')
      if (!objective || !subjective || !behavioral) throw new VerificationConflictError('Evidence aggregates are incomplete')
      const beforeRecords = await db.select().from(evidenceRecords).where(eq(evidenceRecords.storeId, order.storeId))
      const before = buildEvidenceSummary(aggregates, beforeRecords)
      const verificationId = `verification_${randomUUID()}`
      const now = new Date()
      const hasUnfulfilled = input.objectiveResults.some((item) => item.result === 'unfulfilled')
      const allUnknown = input.objectiveResults.every((item) => item.result === 'unknown')
      const objectiveResult = hasUnfulfilled ? 'unfulfilled' : allUnknown ? 'unknown' : 'fulfilled'
      await db.transaction(async (transaction) => {
        await transaction.insert(verifications).values({
          id: verificationId,
          orderId,
          objectiveResult,
          tasteResult: input.tasteResult,
          repurchaseIntent: input.repurchaseIntent,
          note: input.note,
          imagePath: input.imagePath,
          createdAt: now,
        })
        await transaction.insert(verificationItems).values(input.objectiveResults.map((item) => ({
          id: `verification_item_${randomUUID()}`,
          verificationId,
          promiseSnapshotId: item.promiseSnapshotId,
          result: item.result,
        })))
        const subjectiveBucket = input.tasteResult === 'light' ? 'positive' : input.tasteResult === 'balanced' ? 'neutral' : 'negative'
        const behavioralBucket = input.repurchaseIntent === 'yes' ? 'positive' : input.repurchaseIntent === 'maybe' ? 'neutral' : 'negative'
        await transaction.update(evidenceAggregates).set(increment(subjective, subjectiveBucket)).where(eq(evidenceAggregates.id, subjective.id))
        await transaction.update(evidenceAggregates).set(increment(behavioral, behavioralBucket)).where(eq(evidenceAggregates.id, behavioral.id))
        await transaction.insert(evidenceRecords).values([
          { id: `evidence_${randomUUID()}`, storeId: order.storeId, orderId, evidenceType: 'subjective', aspect: subjective.aspect, result: input.tasteResult, status: 'accepted', occurredAt: now, sandbox: true },
          { id: `evidence_${randomUUID()}`, storeId: order.storeId, orderId, evidenceType: 'behavioral', aspect: behavioral.aspect, result: input.repurchaseIntent, status: 'accepted', occurredAt: now, sandbox: true },
        ])
        if (objectiveResult === 'fulfilled') {
          await transaction.update(evidenceAggregates).set(increment(objective, 'positive')).where(eq(evidenceAggregates.id, objective.id))
          await transaction.insert(evidenceRecords).values(input.objectiveResults
            .filter((item) => item.result === 'fulfilled')
            .map((item) => {
              const snapshot = snapshots.find((candidate) => candidate.id === item.promiseSnapshotId)!
              return { id: `evidence_${randomUUID()}`, storeId: order.storeId, orderId, evidenceType: 'objective' as const, aspect: snapshot.aspect, result: 'fulfilled', status: 'accepted' as const, occurredAt: now, sandbox: true }
            }))
          await transaction.update(orders).set({ status: 'completed', updatedAt: now }).where(eq(orders.id, orderId))
        } else if (objectiveResult === 'unfulfilled') {
          await transaction.update(evidenceAggregates).set(increment(objective, 'disputed')).where(eq(evidenceAggregates.id, objective.id))
          await transaction.insert(evidenceRecords).values(input.objectiveResults
            .filter((item) => item.result === 'unfulfilled')
            .map((item) => {
              const snapshot = snapshots.find((candidate) => candidate.id === item.promiseSnapshotId)!
              return { id: `evidence_${randomUUID()}`, storeId: order.storeId, orderId, evidenceType: 'objective' as const, aspect: snapshot.aspect, result: 'unfulfilled', status: 'pending' as const, occurredAt: now, sandbox: true }
            }))
          await transaction.insert(disputes).values({
            id: `dispute_${randomUUID()}`,
            verificationId,
            orderId,
            status: 'pending',
            reason: input.note || '用户提交了图片凭证',
            createdAt: now,
          })
          await transaction.update(orders).set({ status: 'disputed', updatedAt: now }).where(eq(orders.id, orderId))
        } else {
          await transaction.update(orders).set({ status: 'completed', updatedAt: now }).where(eq(orders.id, orderId))
        }
      })
      const updated = await db.select().from(evidenceAggregates).where(eq(evidenceAggregates.storeId, order.storeId))
      const updatedRecords = await db.select().from(evidenceRecords).where(eq(evidenceRecords.storeId, order.storeId))
      return {
        id: verificationId,
        orderId,
        storeId: order.storeId,
        before,
        after: buildEvidenceSummary(updated, updatedRecords),
        disputeCreated: objectiveResult === 'unfulfilled',
      }
    },
  }
}

export type VerificationService = ReturnType<typeof createVerificationService>
