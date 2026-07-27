import { parseNeedFallback } from './fallback'
import { parseNeedResponse } from './schemas'

export async function parseNeed(text: string, allowedStoreIds: string[], timeoutMs = 6000) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: 'parse_need', text, allowedStoreIds }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`AI request failed: ${response.status}`)
    return { ...parseNeedResponse(await response.json(), allowedStoreIds), source: 'online' as const }
  } catch {
    return parseNeedFallback(text)
  } finally {
    window.clearTimeout(timer)
  }
}
