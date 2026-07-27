import rawStores from '../data/stores.json'
import { summarizeEvidence } from './evidence'
import type { RecommendationResult, Store, UserNeed } from './types'

const stores = rawStores as Store[]

const storeTaste: Record<string, NonNullable<UserNeed['taste']>> = {
  'store-beef-01': 'light',
  'store-beef-02': 'rich',
  'store-chicken-01': 'light',
  'store-pork-01': 'rich',
  'store-veggie-01': 'light',
}

function scoreStore(store: Store, need: UserNeed) {
  const evidence = summarizeEvidence(store.id)
  const withinBudget = need.maxBudget === null || store.price <= need.maxBudget
  const exactCategory = need.preferredCategories.includes(store.category)
  const tasteMatch = need.taste === null || storeTaste[store.id] === need.taste
  const promisesMet = need.fulfillmentNeeds.filter((needKey) =>
    store.promises.includes(needKey),
  ).length

  return (
    (withinBudget ? 28 : -18) +
    (exactCategory ? 32 : 8) +
    (tasteMatch ? 26 : -12) +
    promisesMet * 10 +
    Math.min(evidence.sampleSize, 30) * 0.3
  )
}

export function recommend(need: UserNeed): RecommendationResult[] {
  return stores
    .map((store) => {
      const evidence = summarizeEvidence(store.id)
      const reasons = [
        store.price <= (need.maxBudget ?? Number.POSITIVE_INFINITY)
          ? `到手价¥${store.price}，在预算内`
          : `到手价¥${store.price}，超出当前预算`,
        storeTaste[store.id] === need.taste
          ? '口味感受更接近你的偏好'
          : '口味偏好存在取舍',
      ]
      const cautions = evidence.sampleSize < 10
        ? [`仅${evidence.sampleSize}份有效验证，结论可能波动`]
        : []

      if (storeTaste[store.id] !== need.taste) {
        cautions.push('部分真实订单的口味感受与你不同')
      }

      return {
        storeId: store.id,
        decisionLabel:
          store.id === 'store-beef-01'
            ? '需求最匹配 · 验证量少'
            : evidence.sampleSize >= 20
              ? '验证更充分 · 存在取舍'
              : '相邻品类 · 更稳妥',
        reasons,
        cautions,
        evidence,
        score: scoreStore(store, need),
      }
    })
    .sort((left, right) => right.score - left.score)
}
