export type EvidenceState = 'growing' | 'established' | 'disputed'
export type EvidenceType = 'objective' | 'subjective' | 'behavioral'
export type SourceLayer = 'public' | 'derived' | 'sandbox'

export interface DemoSession {
  id: string
  createdAt: string
  resetAt: string
}

export interface StoreSummary {
  id: string
  slug: string
  name: string
  category: string
  heroDish: string
  heroImage: string
  distanceMeters: number
  deliveryMinutes: number
  averagePrice: number
  fromPrice: number
  evidenceState: EvidenceState
  depth: 'deep' | 'browse'
  sandbox: boolean
}

export interface MenuItem {
  id: string
  storeId: string
  name: string
  description: string
  image: string
  price: number
  isTrial: boolean
}

export interface TrialPlan {
  id: string
  storeId: string
  menuItemId: string
  title: string
  benefitLabel: string
  dailyQuota: number
  remainingQuota: number
  trialPrice: number
  version: number
  status: 'draft' | 'published' | 'paused' | 'archived'
  publishedAt: string | null
}

export type TrialPlanClaimKind = 'objective' | 'preference' | 'specification' | 'unverifiable'
export interface TrialPlanClaim {
  id: string
  planId: string
  kind: TrialPlanClaimKind
  content: string
  sourceText: string
  decision: 'confirmed' | 'modified' | 'rejected'
  sortOrder: number
}

export type CurrentTrialPlan = TrialPlan & { claims: TrialPlanClaim[] }

export interface EvidenceAggregate {
  id: string
  storeId: string
  aspect: string
  evidenceType: EvidenceType
  positiveCount: number
  neutralCount: number
  negativeCount: number
  disputedCount: number
  sourceLayer: SourceLayer
  updatedAt: string
}

export interface EvidenceMetric { aspect: string; positive: number; total: number; disputed: number }
export interface EvidenceRecord {
  id: string
  evidenceType: EvidenceType
  aspect: string
  result: string
  status: 'accepted' | 'pending' | 'rejected'
  occurredAt: string
}
export interface EvidenceSummary {
  validOrders: number
  objective: EvidenceMetric
  oilFit: EvidenceMetric
  repurchase: EvidenceMetric
  growth: { current: number; threshold: number }
  records: EvidenceRecord[]
}

export interface StoreListResponse {
  items: StoreSummary[]
  facets: { categories: string[] }
  total: number
  dataNotice: string
}

export type StoreDetailResponse = StoreSummary & {
  menu: MenuItem[]
  trialPlan?: TrialPlan
  currentPlan: CurrentTrialPlan | null
  evidence: EvidenceAggregate[]
  evidenceSummary: EvidenceSummary
  decisionProfile: {
    verdict: string
    fitFor: string
    fitReason: string
    notFor: string
    riskReason: string
  }
  specifications: Array<{ label: string; value: string; source: 'merchant' }>
  dataNotice: string
}

export type OrderStatus = 'created' | 'preparing' | 'delivering' | 'delivered' | 'pending_verification' | 'completed' | 'disputed'
export interface OrderDetail {
  id: string; sessionId: string; storeId: string; status: OrderStatus; totalAmount: number; sandbox: boolean; createdAt: string; updatedAt: string
  store?: { id: string; name: string; heroDish: string }
  items: Array<{ id: string; menuItemId: string; name: string; unitPrice: number; quantity: number }>
  promises: Array<{
    id: string
    planId: string | null
    claimId: string | null
    kind: 'objective' | 'preference' | 'specification' | null
    aspect: string
    version: number
    merchantConfirmedAt: string
  }>
  verification?: {
    id: string
    objectiveResult: 'fulfilled' | 'unfulfilled' | 'unknown'
    tasteResult: 'light' | 'balanced' | 'rich'
    repurchaseIntent: 'yes' | 'maybe' | 'no'
    note: string | null
    imagePath: string | null
    createdAt: string
    items: Array<{ promiseSnapshotId: string; result: 'fulfilled' | 'unfulfilled' | 'unknown' }>
  } | null
}
export interface CreateOrderInput { storeId: string; items: Array<{ menuItemId: string; quantity: number }> }
export interface OrderListResponse { items: OrderDetail[] }
export interface SubmitVerificationInput {
  objectiveResults: Array<{
    promiseSnapshotId: string
    result: 'fulfilled' | 'unfulfilled' | 'unknown'
  }>
  tasteResult: 'light' | 'balanced' | 'rich'
  repurchaseIntent: 'yes' | 'maybe' | 'no'
  note?: string
  imagePath?: string | null
}
export interface EvidenceSnapshot { aspect:string; total:number; positiveCount:number; neutralCount:number; negativeCount:number; disputedCount:number }
export interface VerificationResult { id:string; orderId:string; storeId:string; disputeCreated:boolean; before:EvidenceSummary; after:EvidenceSummary }
