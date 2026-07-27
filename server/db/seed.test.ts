import { describe, expect, it } from 'vitest'
import { seedStores } from './seed-data'

describe('seedStores', () => {
  it('contains a browseable inventory', () => {
    expect(seedStores).toHaveLength(12)
    expect(new Set(seedStores.map((store) => store.category)).size).toBeGreaterThanOrEqual(5)
  })

  it('locks the three deep demonstration stores', () => {
    expect(seedStores.filter((store) => store.depth === 'deep').map((store) => store.id)).toEqual([
      'store-beef-01',
      'store-beef-02',
      'store-chicken-01',
    ])
  })

  it('gives every store complete browse data', () => {
    for (const store of seedStores) {
      expect(store.menu.length).toBeGreaterThanOrEqual(2)
      expect(store.trialPlan.status).toBe('published')
      expect(store.evidence.map((row) => row.evidenceType).sort()).toEqual([
        'behavioral',
        'objective',
        'subjective',
      ])
    }
  })

  it('locks the hero store to the V3 evidence ledger', () => {
    const store = seedStores.find((item) => item.id === 'store-beef-01')!
    const byType = Object.fromEntries(store.evidence.map((row) => [row.evidenceType, row]))

    expect(byType.objective).toMatchObject({
      aspect: '独立密封分装',
      positiveCount: 8,
      neutralCount: 0,
      negativeCount: 0,
    })
    expect(byType.subjective).toMatchObject({
      aspect: '少油感受',
      positiveCount: 7,
      neutralCount: 0,
      negativeCount: 1,
    })
    expect(byType.behavioral).toMatchObject({
      aspect: '正常价复购意愿',
      positiveCount: 6,
      neutralCount: 1,
      negativeCount: 1,
    })
    expect(store.evidenceRecords).toContainEqual(expect.objectContaining({
      evidenceType: 'subjective',
      aspect: '少油感受',
      result: 'rich',
      status: 'accepted',
    }))
  })

  it('gives all three recommended stores traceable, differentiated ledgers', () => {
    const expected = {
      'store-beef-01': { samples: 8, objective: '独立密封分装' },
      'store-beef-02': { samples: 34, objective: '牛肉足量' },
      'store-chicken-01': { samples: 19, objective: '汤饭分装' },
    }

    for (const [storeId, ledger] of Object.entries(expected)) {
      const store = seedStores.find((item) => item.id === storeId)!
      const objective = store.evidence.find((item) => item.evidenceType === 'objective')!
      expect(objective.aspect).toBe(ledger.objective)
      expect(objective.positiveCount + objective.neutralCount + objective.negativeCount).toBe(ledger.samples)
      expect(store.evidenceRecords.length).toBeGreaterThan(0)
    }

    const richStore = seedStores.find((item) => item.id === 'store-beef-02')!
    expect(richStore.evidenceRecords).toContainEqual(expect.objectContaining({
      evidenceType: 'subjective',
      result: 'rich',
      status: 'accepted',
    }))
  })
})
