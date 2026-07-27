import type { EvidenceAggregateRow, EvidenceRecordRow } from '../../db/schema'

const total = (row: EvidenceAggregateRow) => row.positiveCount + row.neutralCount + row.negativeCount

export function buildEvidenceSummary(aggregates: EvidenceAggregateRow[], records: EvidenceRecordRow[]) {
  const objective = aggregates.find((row) => row.evidenceType === 'objective')
  const subjective = aggregates.find((row) => row.evidenceType === 'subjective')
  const behavioral = aggregates.find((row) => row.evidenceType === 'behavioral')
  if (!objective || !subjective || !behavioral) throw new Error('Evidence aggregates are incomplete')
  const metric = (row: EvidenceAggregateRow) => ({
    aspect: row.aspect,
    positive: row.positiveCount,
    total: total(row),
    disputed: row.disputedCount,
  })
  const validOrders = total(objective)
  return {
    validOrders,
    objective: metric(objective),
    oilFit: metric(subjective),
    repurchase: metric(behavioral),
    growth: { current: validOrders, threshold: 10 },
    records: records.map((record) => ({
      id: record.id,
      evidenceType: record.evidenceType,
      aspect: record.aspect,
      result: record.result,
      status: record.status,
      occurredAt: record.occurredAt.toISOString(),
    })),
  }
}
