import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import {
  demoSessions,
  evidenceAggregates,
  menuItems,
  stores,
  trialPlans,
} from './schema'

describe('foundation database schema', () => {
  it('exports stable table names', () => {
    expect([
      getTableName(demoSessions),
      getTableName(stores),
      getTableName(menuItems),
      getTableName(trialPlans),
      getTableName(evidenceAggregates),
    ]).toEqual([
      'demo_sessions',
      'stores',
      'menu_items',
      'trial_plans',
      'evidence_aggregates',
    ])
  })
})
