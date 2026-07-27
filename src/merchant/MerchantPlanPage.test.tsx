import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '../app/AppProviders'
import { DemoSessionProvider } from '../demo/DemoSessionProvider'
import { MerchantPlanPage } from './MerchantPlanPage'

const active = {
  id: 'store-beef-01-plan-v1',
  storeId: 'store-beef-01',
  menuItemId: 'store-beef-01-trial',
  title: '招牌现切牛肉饭可信试新',
  benefitLabel: '试新保障',
  dailyQuota: 10,
  remainingQuota: 7,
  trialPrice: 23.9,
  version: 1,
  status: 'published',
  publishedAt: '2026-07-20T10:30:00.000Z',
  claims: [{
    id: 'beef-v1-sealed',
    planId: 'store-beef-01-plan-v1',
    kind: 'objective',
    content: '汤与米饭使用独立密封容器',
    sourceText: '汤饭分开装',
    decision: 'confirmed',
    sortOrder: 1,
  }],
}

let published = false
const server = setupServer(
  http.post('/api/sessions', () => HttpResponse.json({
    id: 'demo-test',
    createdAt: '2026-07-22T00:00:00.000Z',
    resetAt: '2026-07-22T00:00:00.000Z',
  }, { status: 201 })),
  http.get('/api/merchant/stores/store-beef-01/plans/workbench', () => HttpResponse.json({
    active: published ? { ...active, version: 2, status: 'published' } : active,
    draft: null,
    history: [],
  })),
  http.post('/api/merchant/stores/store-beef-01/plans/draft', () => HttpResponse.json({
    ...active,
    id: 'draft-v2',
    version: 2,
    status: 'draft',
    publishedAt: null,
  }, { status: 201 })),
  http.post('/api/ai/extract-claims', () => HttpResponse.json({
    source: 'fallback',
    candidates: [
      { id: 'a', kind: 'objective', content: '汤与米饭使用独立密封容器', sourceText: '汤饭分开装', rationale: '可客观确认' },
      { id: 'b', kind: 'preference', content: '支持少油制作', sourceText: '少油', rationale: '形成感受分布' },
      { id: 'c', kind: 'unverifiable', content: '招牌好吃不踩雷', sourceText: '招牌好吃不踩雷', rationale: '主观宣传不可验证' },
    ],
  })),
  http.put('/api/merchant/stores/store-beef-01/plans/draft-v2', async ({ request }) => {
    const body = await request.json() as { claims: Array<{ content: string; decision: string }> }
    expect(body.claims).toContainEqual(expect.objectContaining({
      content: '招牌好吃不踩雷',
      decision: 'rejected',
    }))
    return HttpResponse.json({ ...active, id: 'draft-v2', version: 2, status: 'draft', claims: body.claims })
  }),
  http.post('/api/merchant/stores/store-beef-01/plans/draft-v2/publish', () => {
    published = true
    return HttpResponse.json({ ...active, id: 'draft-v2', version: 2, status: 'published' })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  localStorage.clear()
  published = false
})

it('turns merchant copy into a controllable V2 plan and publishes it', async () => {
  const user = userEvent.setup()
  render(
    <AppProviders>
      <DemoSessionProvider>
        <MemoryRouter initialEntries={['/merchant/store-beef-01/plans']}>
          <Routes>
            <Route path="/merchant/:storeId/plans" element={<MerchantPlanPage />} />
          </Routes>
        </MemoryRouter>
      </DemoSessionProvider>
    </AppProviders>,
  )

  expect(await screen.findByText('试新方案 V1')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '编辑为新版本' }))
  await user.clear(screen.getByLabelText('商品卖点原文'))
  await user.type(screen.getByLabelText('商品卖点原文'), '汤饭分开装，少油，招牌好吃不踩雷')
  await user.click(screen.getByRole('button', { name: 'AI 识别可验证卖点' }))

  expect(await screen.findByText('客观承诺')).toBeInTheDocument()
  expect(screen.getByDisplayValue('汤与米饭使用独立密封容器')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '拒绝 招牌好吃不踩雷' }))
  await user.click(screen.getByRole('button', { name: '发布试新方案' }))

  expect(await screen.findByRole('status')).toHaveTextContent('V2 已发布')
})

it('presents 01 to 04 as a publishing progress indicator rather than navigation', async () => {
  render(
    <AppProviders>
      <DemoSessionProvider>
        <MemoryRouter initialEntries={['/merchant/store-beef-01/plans']}>
          <Routes>
            <Route path="/merchant/:storeId/plans" element={<MerchantPlanPage />} />
          </Routes>
        </MemoryRouter>
      </DemoSessionProvider>
    </AppProviders>,
  )

  const progress = await screen.findByRole('complementary', { name: '承诺方案发布进度' })
  expect(progress).toHaveTextContent('当前步骤')
  expect(progress).toHaveTextContent('等待上一步')
  expect(screen.queryByRole('link', { name: /创建 V2 草稿/ })).not.toBeInTheDocument()
})
