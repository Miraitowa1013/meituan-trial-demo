export type ConfidenceLevel = 'growing' | 'moderate' | 'stable'
export type TastePreference = 'light' | 'balanced' | 'rich'
export type ValidationStatus = 'verified' | 'pending_review'

export interface Store {
  id: string
  name: string
  category: string
  heroDish: string
  price: number
  distanceMeters: number
  openedDaysAgo: number
  tags: string[]
  promises: string[]
  isDemoData: true
}

export interface ValidationRecord {
  id: string
  storeId: string
  orderId: string
  orderCompleted: true
  status: ValidationStatus
  separatedPackaging: boolean
  lowOilRequestMet: boolean
  standardProteinMet: boolean
  oiliness: TastePreference
  portion: 'light' | 'enough' | 'generous'
  fullPriceRepurchaseIntent: boolean
  addedToFrequent: boolean
  actualFullPriceRepurchase: boolean
  createdAt: string
  isDemoData: true
}

export interface UserNeed {
  maxBudget: number | null
  preferredCategories: string[]
  taste: TastePreference | null
  fulfillmentNeeds: string[]
}

export interface EvidenceSummary {
  sampleSize: number
  confidence: ConfidenceLevel
  objective: Array<{ key: string; fulfilled: number; total: number }>
  subjective: Array<{ key: string; distribution: Record<string, number> }>
  behavioral: {
    fullPriceRepurchaseIntent: number
    addedToFrequent: number
    actualFullPriceRepurchase: number
  }
}

export interface RecommendationResult {
  storeId: string
  decisionLabel: string
  reasons: string[]
  cautions: string[]
  evidence: EvidenceSummary
  score: number
}
