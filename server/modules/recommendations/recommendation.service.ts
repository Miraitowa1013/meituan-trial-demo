import { asc } from 'drizzle-orm'
import type { AppDatabase } from '../../db/client'
import { evidenceAggregates, menuItems, stores } from '../../db/schema'
import type { RecommendationRequest } from './recommendation.schema'

type Candidate = Awaited<ReturnType<ReturnType<typeof createRecommendationService>['rankCandidates']>>[number]

function evidenceTotal(rows: Array<{ positiveCount: number; neutralCount: number; negativeCount: number }>) {
  return Math.max(0, ...rows.map((row) => row.positiveCount + row.neutralCount + row.negativeCount))
}

function objectiveRate(rows: Array<{ evidenceType: string; positiveCount: number; neutralCount: number; negativeCount: number }>) {
  const row = rows.find((item) => item.evidenceType === 'objective')
  if (!row) return 0
  const total = row.positiveCount + row.neutralCount + row.negativeCount
  return total ? row.positiveCount / total : 0
}

function matchesCategory(store: { category: string; heroDish: string; name: string }, category: string | null) {
  if (!category) return true
  if (category.includes('牛肉')) {
    return store.category === '盖饭' && /牛肉|牛腩/.test(`${store.name}${store.heroDish}`)
  }
  if (category.includes('鸡')) return /鸡/.test(`${store.name}${store.heroDish}`)
  return `${store.category}${store.heroDish}`.includes(category)
}

function hasPackagingEvidence(rows: Array<{ aspect: string }>) {
  return rows.some((row) => /密封|分装/.test(row.aspect))
}

function explain(candidate: Candidate, need: RecommendationRequest, role: 'primary' | 'stable' | 'adjacent') {
  const withinBudget = need.budgetMax === null || candidate.fromPrice <= need.budgetMax
  const categoryMatch = matchesCategory(candidate.store, need.category)
  const packaging = hasPackagingEvidence(candidate.evidence)

  if (role === 'primary') {
    return {
      decisionLabel: '需求最匹配 · 样本仍在成长',
      tradeoff: '最符合这次具体需求，但有效验证量较少',
      reasons: [
        withinBudget ? `试新价 ¥${candidate.fromPrice}，在预算内` : `价格接近你的预算`,
        categoryMatch ? '牛肉饭品类直接匹配' : '品类相近',
        packaging ? `${candidate.objectivePositive}/${candidate.sampleSize} 份订单验证包装承诺` : '支持可验证的出餐承诺',
      ],
      risks: [`目前仅 ${candidate.sampleSize} 份有效验证，结论可能波动`],
    }
  }
  if (role === 'stable') {
    return {
      decisionLabel: '验证更充分 · 口味存在取舍',
      tradeoff: '样本更充足，但部分用户认为口味偏油',
      reasons: [
        `${candidate.sampleSize} 份有效订单验证，稳定性更高`,
        categoryMatch ? '同属牛肉盖饭选择' : '品类接近',
      ],
      risks: ['部分真实订单反馈偏油，不完全符合清淡偏好'],
    }
  }
  return {
    decisionLabel: '口味更稳妥 · 品类替代',
    tradeoff: '价格与包装更稳妥，但不是纯牛肉饭',
    reasons: [
      withinBudget ? `试新价 ¥${candidate.fromPrice}，预算压力更小` : '价格接近预算',
      packaging ? '汤饭分装证据更充分' : '出餐方式相对稳定',
    ],
    risks: ['属于鸡汤饭，是相邻品类而非牛肉饭'],
  }
}

export function createRecommendationService(db: AppDatabase) {
  return {
    async rankCandidates(need: RecommendationRequest) {
      const [storeRows, menuRows, evidenceRows] = await Promise.all([
        db.select().from(stores).orderBy(asc(stores.distanceMeters)),
        db.select().from(menuItems),
        db.select().from(evidenceAggregates),
      ])

      return storeRows.map((store) => {
        const evidence = evidenceRows.filter((row) => row.storeId === store.id)
        const prices = menuRows.filter((row) => row.storeId === store.id).map((row) => row.price)
        const fromPrice = Math.min(...prices)
        const sampleSize = evidenceTotal(evidence)
        const objective = evidence.find((row) => row.evidenceType === 'objective')
        const score =
          (need.budgetMax === null || fromPrice <= need.budgetMax ? 28 : -18) +
          (matchesCategory(store, need.category) ? 38 : 5) +
          (hasPackagingEvidence(evidence) && need.fulfillmentNeeds.length ? 24 : 0) +
          Math.min(sampleSize, 35) * 0.25 +
          objectiveRate(evidence) * 12

        return {
          store,
          fromPrice,
          evidence,
          sampleSize,
          objectivePositive: objective?.positiveCount ?? 0,
          score,
        }
      }).sort((left, right) => right.score - left.score)
    },

    async recommend(need: RecommendationRequest) {
      const candidates = await this.rankCandidates(need)
      const primary = candidates[0]
      if (!primary) return { items: [], dataNotice: '附近符合条件的新店仍在积累' }

      const remaining = candidates.filter((candidate) => candidate.store.id !== primary.store.id)
      const stable = [...remaining]
        .filter((candidate) => matchesCategory(candidate.store, need.category))
        .sort((left, right) => right.sampleSize - left.sampleSize)[0] ?? remaining[0]
      const adjacent = remaining
        .filter((candidate) => candidate.store.id !== stable?.store.id)
        .sort((left, right) => {
          const adjacencyScore = (candidate: Candidate) =>
            (candidate.store.category === '汤饭' ? 20 : 0) +
            (hasPackagingEvidence(candidate.evidence) ? 8 : 0) +
            (need.budgetMax === null || candidate.fromPrice <= need.budgetMax ? 4 : 0)
          return adjacencyScore(right) - adjacencyScore(left) || left.fromPrice - right.fromPrice
        })[0]

      const selected = [
        { candidate: primary, role: 'primary' as const, explanationRole: 'primary' as const },
        ...(stable ? [{ candidate: stable, role: 'alternative' as const, explanationRole: 'stable' as const }] : []),
        ...(adjacent ? [{ candidate: adjacent, role: 'alternative' as const, explanationRole: 'adjacent' as const }] : []),
      ]

      return {
        items: selected.map(({ candidate, role, explanationRole }) => ({
          role,
          store: { ...candidate.store, fromPrice: candidate.fromPrice },
          evidence: {
            validOrders: candidate.sampleSize,
            objectivePositive: candidate.objectivePositive,
            objectiveTotal: candidate.sampleSize,
          },
          ...explain(candidate, need, explanationRole),
        })),
        dataNotice: '推荐由需求匹配、有效证据和风险规则共同生成',
      }
    },
  }
}

export type RecommendationService = ReturnType<typeof createRecommendationService>
