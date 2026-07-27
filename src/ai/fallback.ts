import type { UserNeed } from '../domain/types'

export function parseNeedFallback(text: string): { need: UserNeed; source: 'fallback' } {
  const budget = text.match(/(\d+(?:\.\d+)?)\s*元/)
  const category = /牛肉/.test(text) ? '牛肉饭' : /鸡/.test(text) ? '鸡汤饭' : '工作餐'
  const taste = /清淡|少油/.test(text) ? 'light' : /重口|浓/.test(text) ? 'rich' : 'balanced'
  const fulfillmentNeeds = [
    ...(/分装|汤饭/.test(text) ? ['separated_packaging'] : []),
    ...(/少油|清淡/.test(text) ? ['low_oil'] : []),
  ]

  return {
    need: {
      maxBudget: budget ? Number(budget[1]) : null,
      preferredCategories: [category],
      taste,
      fulfillmentNeeds,
    },
    source: 'fallback',
  }
}
