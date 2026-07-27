import { expect, it } from 'vitest'
import { createStoreTestApp } from '../../test/create-store-test-app'

it('filters the database inventory', async () => {
  const testApp = await createStoreTestApp()
  const response = await testApp.app.request('/api/stores?q=牛肉&maxPrice=25&evidenceState=growing')
  expect(response.status).toBe(200)
  const body = await response.json() as { items: Array<{ id: string; fromPrice: number }>; facets: { categories: string[] } }
  expect(body.items.map((item) => item.id)).toContain('store-beef-01')
  expect(body.items.every((item) => item.fromPrice <= 25)).toBe(true)
  expect(body.facets.categories.length).toBeGreaterThanOrEqual(5)
  await testApp.close()
})

it('combines meal period, category, price and distance filters', async () => {
  const testApp = await createStoreTestApp()
  const response = await testApp.app.request('/api/stores?mealPeriod=dinner&category=盖饭&maxPrice=25&maxDistance=1000&sort=distance')
  expect(response.status).toBe(200)
  const body = await response.json() as { items: Array<{ category: string; fromPrice: number; distanceMeters: number }> }
  expect(body.items.length).toBeGreaterThan(0)
  expect(body.items.every((item) => item.category === '盖饭' && item.fromPrice <= 25 && item.distanceMeters <= 1000)).toBe(true)
  await testApp.close()
})

it('returns the published plan, classified claims, starting price and three evidence types', async () => {
  const testApp = await createStoreTestApp()
  const response = await testApp.app.request('/api/stores/store-beef-01')
  expect(response.status).toBe(200)
  const body = await response.json() as {
    fromPrice: number
    dataNotice: string
    menu: unknown[]
    trialPlan: { status: string }
    currentPlan: {
      version: number
      status: string
      dailyQuota: number
      remainingQuota: number
      trialPrice: number
      claims: Array<{ kind: string; content: string }>
    }
    evidence: Array<{ evidenceType: string }>
    evidenceSummary: any
    specifications: unknown[]
  }
  expect(body.fromPrice).toBe(23.9)
  expect(body.dataNotice).toContain('沙盒')
  expect(body.menu.length).toBeGreaterThanOrEqual(2)
  expect(body.trialPlan.status).toBe('published')
  expect(body.currentPlan).toMatchObject({
    version: 1,
    status: 'published',
    dailyQuota: 10,
    remainingQuota: 7,
    trialPrice: 23.9,
    claims: expect.arrayContaining([
      expect.objectContaining({ kind: 'objective', content: '汤与米饭使用独立密封容器' }),
      expect.objectContaining({ kind: 'preference', content: '支持少油制作' }),
      expect.objectContaining({ kind: 'specification', content: '商家标称牛肉 80g' }),
    ]),
  })
  expect(body.evidence.map((row) => row.evidenceType).sort()).toEqual(['behavioral', 'objective', 'subjective'])
  expect(body.evidenceSummary).toMatchObject({
    validOrders: 8,
    objective: { aspect: '独立密封分装', positive: 8, total: 8 },
    oilFit: { positive: 7, total: 8 },
    repurchase: { positive: 6, total: 8 },
    growth: { current: 8, threshold: 10 },
  })
  expect(body.evidenceSummary.records).toContainEqual(expect.objectContaining({ aspect: '少油感受', result: 'rich' }))
  expect(body.specifications).toContainEqual({ label: '牛肉规格', value: '商家标称 80g', source: 'merchant' })
  await testApp.close()
})

it('returns a distinct decision profile and traceable evidence for every recommended store', async () => {
  const testApp = await createStoreTestApp()
  const expectations = [
    {
      id: 'store-beef-01',
      validOrders: 8,
      fitFor: '需要独立密封分装、偏好清淡口味的人',
      notFor: '只接受大量成熟样本、完全不接受口味波动的人',
      objectiveAspect: '独立密封分装',
    },
    {
      id: 'store-beef-02',
      validOrders: 34,
      fitFor: '更看重牛肉分量、希望参考更多历史验证的人',
      notFor: '偏好清淡口味、介意黑椒风味偏浓的人',
      objectiveAspect: '牛肉足量',
    },
    {
      id: 'store-chicken-01',
      validOrders: 19,
      fitFor: '预算更低、偏好清淡汤饭与稳定分装的人',
      notFor: '只想吃牛肉饭、不接受相邻品类替代的人',
      objectiveAspect: '汤饭分装',
    },
  ]

  for (const expected of expectations) {
    const response = await testApp.app.request(`/api/stores/${expected.id}`)
    expect(response.status).toBe(200)
    const body = await response.json() as {
      menu: unknown[]
      trialPlan: { status: string }
      decisionProfile: { fitFor: string; notFor: string }
      evidenceSummary: { validOrders: number; objective: { aspect: string }; records: unknown[] }
    }
    expect(body.menu.length).toBeGreaterThanOrEqual(2)
    expect(body.trialPlan.status).toBe('published')
    expect(body.decisionProfile).toMatchObject({
      fitFor: expected.fitFor,
      notFor: expected.notFor,
    })
    expect(body.evidenceSummary.validOrders).toBe(expected.validOrders)
    expect(body.evidenceSummary.objective.aspect).toBe(expected.objectiveAspect)
    expect(body.evidenceSummary.records.length).toBeGreaterThan(0)
  }

  await testApp.close()
})
