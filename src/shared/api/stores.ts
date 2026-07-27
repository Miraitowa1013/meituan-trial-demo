import { apiRequest } from './http'
import type { StoreDetailResponse, StoreListResponse } from './contracts'

export interface StoreFilters {
  q?: string
  mealPeriod?: 'breakfast' | 'lunch' | 'dinner' | 'lateNight'
  category?: string
  maxPrice?: number
  maxDistance?: number
  evidenceState?: 'growing' | 'established' | 'disputed'
  sort?: 'recommended' | 'distance' | 'price' | 'evidence'
}

export function getStores(filters: StoreFilters = {}) {
  const search = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value))
  })
  const suffix = search.size ? `?${search.toString()}` : ''
  return apiRequest<StoreListResponse>(`/stores${suffix}`)
}

export function getStore(id: string) {
  return apiRequest<StoreDetailResponse>(`/stores/${encodeURIComponent(id)}`)
}
