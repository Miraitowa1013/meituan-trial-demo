import { describe, expect, it } from 'vitest'
import { defaultNeed } from '../data/scenarios'
import { summarizeEvidence } from './evidence'
import { validateMerchantClaim } from './promises'
import { recommend } from './recommendation'
import { submitValidation } from './validation'

describe('evidence rules', () => {
  it('summarizes the hero store from verified orders only', () => {
    const summary = summarizeEvidence('store-beef-01')

    expect(summary.sampleSize).toBe(8)
    expect(summary.confidence).toBe('growing')
    expect(summary.objective).toContainEqual({
      key: 'separated_packaging',
      fulfilled: 8,
      total: 8,
    })
    expect(summary.subjective[0].distribution).toEqual({
      light: 3,
      balanced: 4,
      rich: 1,
    })
  })
})

describe('recommendation rules', () => {
  it('places the hero store first for the default light beef-rice need', () => {
    expect(recommend(defaultNeed)[0].storeId).toBe('store-beef-01')
  })

  it('changes the leading store when the user switches to rich taste', () => {
    expect(recommend({ ...defaultNeed, taste: 'rich' })[0].storeId).not.toBe(
      'store-beef-01',
    )
  })

  it('discloses uncertainty when a store has fewer than ten samples', () => {
    expect(recommend(defaultNeed)[0].cautions).toContain('仅8份有效验证，结论可能波动')
  })
})

describe('fair validation rules', () => {
  it('keeps disputed objective feedback pending while still rewarding the user', () => {
    const result = submitValidation({
      storeId: 'store-beef-01',
      orderId: 'demo-order-new',
      separatedPackaging: false,
      lowOilRequestMet: true,
      standardProteinMet: true,
      oiliness: 'balanced',
      portion: 'enough',
      fullPriceRepurchaseIntent: false,
      addedToFrequent: false,
      actualFullPriceRepurchase: false,
      hasEvidenceImage: true,
    })

    expect(result.objectiveState).toBe('pending_review')
    expect(result.rewardGranted).toBe(true)
    expect(result.countedInFulfillmentRate).toBe(false)
  })
})

describe('merchant promise rules', () => {
  it('keeps vague taste language outside objective promises', () => {
    expect(validateMerchantClaim('清淡好吃').kind).toBe('subjective_only')
  })

  it('accepts a platform-verifiable packaging template', () => {
    expect(validateMerchantClaim('汤饭分装').kind).toBe('objective_template')
  })

  it('asks merchants to quantify vague portion claims', () => {
    expect(validateMerchantClaim('分量足').kind).toBe('needs_parameter')
  })
})
