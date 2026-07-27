import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createDemandRoutes } from './demand.routes'
import { createDemandService } from './demand.service'

function createTestApp() {
  const service = createDemandService({
    provider: 'fallback',
    apiKey: undefined,
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  })
  return new Hono().route('/api/ai', createDemandRoutes(service))
}

describe('POST /api/ai/parse-demand', () => {
  it('translates delivery wording into a merchant-controlled condition', async () => {
    const response = await createTestApp().request('/api/ai/parse-demand', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '今晚加班，25元以内牛肉饭，少油，汤别洒' }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      budgetMax: 25,
      category: '牛肉饭',
      taste: ['偏清淡'],
      fulfillmentNeeds: [{
        raw: '汤别洒',
        normalized: '汤与米饭使用独立密封容器',
        responsibleParty: 'merchant',
      }],
      source: 'fallback',
    })
  })

  it('rejects an empty demand', async () => {
    const response = await createTestApp().request('/api/ai/parse-demand', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: ' ' }),
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ code: 'INVALID_DEMAND' })
  })
})
