import { describe, expect, it } from 'vitest'
import stores from './stores.json'
import validations from './validations.json'

describe('demo dataset integrity', () => {
  it('contains exactly five synthetic stores', () => {
    expect(stores).toHaveLength(5)
    expect(stores.every((store) => store.isDemoData)).toBe(true)
  })

  it('contains at least one hundred completed-order validations', () => {
    expect(validations.length).toBeGreaterThanOrEqual(100)
    expect(validations.every((validation) => validation.orderCompleted)).toBe(true)
    expect(validations.every((validation) => validation.isDemoData)).toBe(true)
  })

  it('links every validation to an existing store', () => {
    const storeIds = new Set(stores.map((store) => store.id))
    expect(validations.every((validation) => storeIds.has(validation.storeId))).toBe(true)
  })

  it('starts the hero store with exactly eight verified validations', () => {
    const heroValidations = validations.filter(
      (validation) =>
        validation.storeId === 'store-beef-01' && validation.status === 'verified',
    )

    expect(heroValidations).toHaveLength(8)
  })
})
