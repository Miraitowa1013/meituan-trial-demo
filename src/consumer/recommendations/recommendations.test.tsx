import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '../../app/AppProviders'
import { RecommendationsPage } from './RecommendationsPage'

const items = [
  {
    role: 'primary',
    store: { id: 'store-beef-01', slug: 'beef-01', name: '巷口牛肉饭', category: '盖饭', heroDish: '招牌现切牛肉饭', heroImage: '', distanceMeters: 680, deliveryMinutes: 31, averagePrice: 28, fromPrice: 23.9, evidenceState: 'growing', depth: 'deep', sandbox: true },
    evidence: { validOrders: 8, objectivePositive: 8, objectiveTotal: 8 },
    decisionLabel: '需求最匹配 · 样本仍在成长',
    tradeoff: '最符合这次具体需求，但有效验证量较少',
    reasons: ['价格在预算内', '牛肉饭品类直接匹配', '8/8 份订单验证包装承诺'],
    risks: ['目前仅 8 份有效验证，结论可能波动'],
  },
  {
    role: 'alternative',
    store: { id: 'store-beef-02', slug: 'beef-02', name: '老灶牛肉盖饭', category: '盖饭', heroDish: '黑椒牛肉盖饭', heroImage: '', distanceMeters: 920, deliveryMinutes: 35, averagePrice: 29, fromPrice: 25, evidenceState: 'established', depth: 'deep', sandbox: true },
    evidence: { validOrders: 34, objectivePositive: 32, objectiveTotal: 34 },
    decisionLabel: '验证更充分 · 口味存在取舍',
    tradeoff: '样本更充足，但部分用户认为口味偏油',
    reasons: ['34 份有效订单验证'],
    risks: ['部分真实订单反馈偏油'],
  },
  {
    role: 'alternative',
    store: { id: 'store-chicken-01', slug: 'chicken-01', name: '禾味鸡汤饭', category: '汤饭', heroDish: '菌菇鸡汤饭', heroImage: '', distanceMeters: 760, deliveryMinutes: 29, averagePrice: 26, fromPrice: 22.8, evidenceState: 'established', depth: 'deep', sandbox: true },
    evidence: { validOrders: 19, objectivePositive: 19, objectiveTotal: 19 },
    decisionLabel: '口味更稳妥 · 品类替代',
    tradeoff: '价格与包装更稳妥，但不是纯牛肉饭',
    reasons: ['汤饭分装证据更充分'],
    risks: ['属于鸡汤饭，是相邻品类'],
  },
]

const server = setupServer(
  http.post('/api/recommendations', () => HttpResponse.json({
    items,
    dataNotice: '推荐由需求匹配、有效证据和风险规则共同生成',
  })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderPage() {
  const demand = encodeURIComponent(JSON.stringify({
    budgetMax: 25,
    category: '牛肉饭',
    taste: ['偏清淡'],
    fulfillmentNeeds: ['汤与米饭使用独立密封容器'],
  }))
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[`/trial/recommendations?demand=${demand}`]}>
        <Routes>
          <Route path="/trial/recommendations" element={<RecommendationsPage />} />
          <Route path="/trial/stores/:storeId" element={<h1>店铺证据详情</h1>} />
          <Route path="/trial/understand" element={<h1>修改需求</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('recommendations page', () => {
  it('shows one primary choice and two alternatives with explicit tradeoffs', async () => {
    renderPage()

    expect(await screen.findByText('主推荐')).toBeInTheDocument()
    expect(screen.getByText('备选 1')).toBeInTheDocument()
    expect(screen.getByText('备选 2')).toBeInTheDocument()
    expect(screen.getByText('最符合这次具体需求，但有效验证量较少')).toBeInTheDocument()
    expect(screen.getByText('样本更充足，但部分用户认为口味偏油')).toBeInTheDocument()
  })

  it('lets users open every recommended store', async () => {
    const user = userEvent.setup()
    renderPage()

    const links = await screen.findAllByRole('link', { name: /查看.*证据/ })
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveTextContent('查看证据并选择套餐')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/trial/stores/store-beef-01',
      '/trial/stores/store-beef-02',
      '/trial/stores/store-chicken-01',
    ])
    await user.click(links[1])
    expect(await screen.findByRole('heading', { name: '店铺证据详情' })).toBeInTheDocument()
  })
})
