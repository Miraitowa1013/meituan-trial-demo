import rawValidations from '../data/validations.json'
import type {
  ConfidenceLevel,
  EvidenceSummary,
  ValidationRecord,
} from './types'

const validations = rawValidations as ValidationRecord[]

export function confidenceFor(sampleSize: number): ConfidenceLevel {
  if (sampleSize >= 30) return 'stable'
  if (sampleSize >= 10) return 'moderate'
  return 'growing'
}

export function summarizeEvidence(storeId: string): EvidenceSummary {
  const verified = validations.filter(
    (validation) =>
      validation.storeId === storeId && validation.status === 'verified',
  )

  const countTrue = (key: 'separatedPackaging' | 'lowOilRequestMet' | 'standardProteinMet') =>
    verified.filter((validation) => validation[key]).length

  const distribution = (key: 'oiliness' | 'portion') =>
    verified.reduce<Record<string, number>>((result, validation) => {
      const value = validation[key]
      result[value] = (result[value] ?? 0) + 1
      return result
    }, {})

  return {
    sampleSize: verified.length,
    confidence: confidenceFor(verified.length),
    objective: [
      {
        key: 'separated_packaging',
        fulfilled: countTrue('separatedPackaging'),
        total: verified.length,
      },
      {
        key: 'low_oil',
        fulfilled: countTrue('lowOilRequestMet'),
        total: verified.length,
      },
      {
        key: 'standard_protein',
        fulfilled: countTrue('standardProteinMet'),
        total: verified.length,
      },
    ],
    subjective: [
      { key: 'oiliness', distribution: distribution('oiliness') },
      { key: 'portion', distribution: distribution('portion') },
    ],
    behavioral: {
      fullPriceRepurchaseIntent: verified.filter(
        (validation) => validation.fullPriceRepurchaseIntent,
      ).length,
      addedToFrequent: verified.filter((validation) => validation.addedToFrequent)
        .length,
      actualFullPriceRepurchase: verified.filter(
        (validation) => validation.actualFullPriceRepurchase,
      ).length,
    },
  }
}
