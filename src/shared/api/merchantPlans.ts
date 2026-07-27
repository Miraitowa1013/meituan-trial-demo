import type { CurrentTrialPlan, TrialPlanClaim, TrialPlanClaimKind } from './contracts'
import { apiRequest } from './http'

export interface PlanHistoryItem {
  id: string
  version: number
  status: 'archived'
  publishedAt: string | null
}

export interface PlanWorkbench {
  active: CurrentTrialPlan | null
  draft: CurrentTrialPlan | null
  history: PlanHistoryItem[]
}

export interface ExtractedClaim {
  id: string
  kind: TrialPlanClaimKind
  content: string
  sourceText: string
  rationale: string
}

export interface ClaimExtractionResult {
  source: 'model' | 'fallback'
  candidates: ExtractedClaim[]
}

export interface SaveDraftInput {
  benefitLabel: string
  dailyQuota: number
  trialPrice: number
  claims: Array<Pick<TrialPlanClaim, 'kind' | 'content' | 'sourceText' | 'decision' | 'sortOrder'>>
}

const sessionHeaders = (sessionId: string) => ({ 'x-demo-session': sessionId })

export const getPlanWorkbench = (sessionId: string, storeId: string) =>
  apiRequest<PlanWorkbench>(`/merchant/stores/${encodeURIComponent(storeId)}/plans/workbench`, {
    headers: sessionHeaders(sessionId),
  })

export const createPlanDraft = (sessionId: string, storeId: string) =>
  apiRequest<CurrentTrialPlan>(`/merchant/stores/${encodeURIComponent(storeId)}/plans/draft`, {
    method: 'POST',
    headers: sessionHeaders(sessionId),
    body: '{}',
  })

export const extractClaimCandidates = (text: string) =>
  apiRequest<ClaimExtractionResult>('/ai/extract-claims', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })

export const savePlanDraft = (
  sessionId: string,
  storeId: string,
  planId: string,
  input: SaveDraftInput,
) => apiRequest<CurrentTrialPlan>(
  `/merchant/stores/${encodeURIComponent(storeId)}/plans/${encodeURIComponent(planId)}`,
  {
    method: 'PUT',
    headers: sessionHeaders(sessionId),
    body: JSON.stringify(input),
  },
)

export const publishPlan = (sessionId: string, storeId: string, planId: string) =>
  apiRequest<CurrentTrialPlan>(
    `/merchant/stores/${encodeURIComponent(storeId)}/plans/${encodeURIComponent(planId)}/publish`,
    {
      method: 'POST',
      headers: sessionHeaders(sessionId),
      body: '{}',
    },
  )
