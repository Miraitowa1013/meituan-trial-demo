import { describe, expect, it } from 'vitest'
import { parseNeedFallback } from './fallback'
import { parseNeedResponse } from './schemas'

describe('provider-neutral AI boundary', () => {
  it('parses the locked demo request locally without any API', () => {
    const result = parseNeedFallback('25元以内，想吃牛肉饭，清淡一点，汤饭分装')
    expect(result.need.maxBudget).toBe(25)
    expect(result.need.preferredCategories).toContain('牛肉饭')
    expect(result.need.taste).toBe('light')
    expect(result.need.fulfillmentNeeds).toContain('separated_packaging')
    expect(result.source).toBe('fallback')
  })

  it('rejects invented stores and malformed provider output', () => {
    expect(() => parseNeedResponse({ need: {}, citedStoreIds: ['invented-store'] }, ['store-beef-01'])).toThrow()
    expect(() => parseNeedResponse('not-json', ['store-beef-01'])).toThrow()
  })
})
