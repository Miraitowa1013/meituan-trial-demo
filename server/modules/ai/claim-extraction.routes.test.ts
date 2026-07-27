import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createClaimExtractionRoutes } from './claim-extraction.routes'
import { createClaimExtractionService } from './claim-extraction.service'

function createTestApp() {
  const service = createClaimExtractionService({
    provider: 'fallback',
    apiKey: undefined,
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  })
  return new Hono().route('/api/ai', createClaimExtractionRoutes(service))
}

describe('POST /api/ai/extract-claims', () => {
  it('classifies merchant copy into four evidence-safe claim types', async () => {
    const response = await createTestApp().request('/api/ai/extract-claims', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: '汤饭分开装，可按备注少油，牛肉标称80g，招牌好吃不踩雷',
      }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      source: 'fallback',
      candidates: [
        { kind: 'objective', content: '汤与米饭使用独立密封容器' },
        { kind: 'preference', content: '支持少油制作' },
        { kind: 'specification', content: '商家标称牛肉 80g' },
        { kind: 'unverifiable', content: '招牌好吃不踩雷' },
      ],
    })
  })

  it('does not turn delivery outcomes into merchant promises', async () => {
    const response = await createTestApp().request('/api/ai/extract-claims', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '保证30分钟送到，汤绝对不会洒' }),
    })

    const body = await response.json()
    expect(body.candidates).toEqual([
      expect.objectContaining({ kind: 'unverifiable' }),
    ])
  })

  it('rejects blank merchant copy', async () => {
    const response = await createTestApp().request('/api/ai/extract-claims', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: ' ' }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ code: 'INVALID_MERCHANT_COPY' })
  })
})
