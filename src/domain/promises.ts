export type MerchantClaimResult =
  | { kind: 'objective_template'; templateKey: string }
  | { kind: 'subjective_only'; field: string }
  | { kind: 'needs_parameter'; suggestedField: string }

export function validateMerchantClaim(claim: string): MerchantClaimResult {
  if (/汤饭分装|酱汁另放|独立包装/.test(claim)) {
    return { kind: 'objective_template', templateKey: 'separated_packaging' }
  }

  if (/分量足|肉很多|足量/.test(claim)) {
    return { kind: 'needs_parameter', suggestedField: 'protein_grams' }
  }

  return { kind: 'subjective_only', field: 'taste_description' }
}
