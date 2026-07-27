import type { TastePreference } from './types'

export interface ValidationInput {
  storeId: string
  orderId: string
  separatedPackaging: boolean
  lowOilRequestMet: boolean
  standardProteinMet: boolean
  oiliness: TastePreference
  portion: 'light' | 'enough' | 'generous'
  fullPriceRepurchaseIntent: boolean
  addedToFrequent: boolean
  actualFullPriceRepurchase: boolean
  hasEvidenceImage: boolean
}

export function submitValidation(input: ValidationInput) {
  const hasObjectiveDispute =
    !input.separatedPackaging ||
    !input.lowOilRequestMet ||
    !input.standardProteinMet

  return {
    objectiveState: hasObjectiveDispute ? ('pending_review' as const) : ('confirmed' as const),
    rewardGranted: true,
    rewardAmount: 10,
    countedInFulfillmentRate: !hasObjectiveDispute,
    evidenceAttached: input.hasEvidenceImage,
  }
}
