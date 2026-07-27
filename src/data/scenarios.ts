import type { UserNeed } from '../domain/types'

export const defaultNeed: UserNeed = {
  maxBudget: 25,
  preferredCategories: ['牛肉饭'],
  taste: 'light',
  fulfillmentNeeds: ['separated_packaging', 'low_oil'],
}

export const demoScenarios = {
  happy: { need: defaultNeed, aiMode: 'online' },
  dispute: { need: defaultNeed, aiMode: 'online' },
  fallback: { need: defaultNeed, aiMode: 'fallback' },
} as const
