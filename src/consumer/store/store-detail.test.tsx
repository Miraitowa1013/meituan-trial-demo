import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '../../app/AppProviders'
import { StoreDetailPage } from './StoreDetailPage'

const server = setupServer(http.get('/api/stores/store-beef-01', () => HttpResponse.json({
  id: 'store-beef-01', slug: 'xiangkou', name: '巷口牛肉饭', category: '盖饭', heroDish: '招牌现切牛肉饭', heroImage: '',
  distanceMeters: 680, deliveryMinutes: 31, averagePrice: 28, fromPrice: 23.9, evidenceState: 'growing', depth: 'deep', sandbox: true,
  menu: [
    { id: 'menu-1', storeId: 'store-beef-01', name: '招牌现切牛肉饭', description: '可选少油，汤饭分装', image: '', price: 23.9, isTrial: true },
    { id: 'menu-2', storeId: 'store-beef-01', name: '双拼牛肉饭', description: '双份满足', image: '', price: 29.9, isTrial: false },
  ],
  trialPlan: { id: 'plan-1', storeId: 'store-beef-01', title: '首批试新计划', benefitLabel: '试新立减4元', dailyQuota: 30, remainingQuota: 12, status: 'published' },
  evidence: [
    { id: 'ev-1', storeId: 'store-beef-01', aspect: '汤饭分装', evidenceType: 'objective', positiveCount: 8, neutralCount: 0, negativeCount: 0, disputedCount: 0, sourceLayer: 'sandbox', updatedAt: '2026-07-22T00:00:00.000Z' },
    { id: 'ev-2', storeId: 'store-beef-01', aspect: '油度感受', evidenceType: 'subjective', positiveCount: 4, neutralCount: 3, negativeCount: 1, disputedCount: 0, sourceLayer: 'sandbox', updatedAt: '2026-07-22T00:00:00.000Z' },
    { id: 'ev-3', storeId: 'store-beef-01', aspect: '正常价复购意愿', evidenceType: 'behavioral', positiveCount: 7, neutralCount: 0, negativeCount: 1, disputedCount: 0, sourceLayer: 'sandbox', updatedAt: '2026-07-22T00:00:00.000Z' },
  ],
  evidenceSummary: {
    validOrders: 8,
    objective: { aspect: '汤饭分装', positive: 8, total: 8, disputed: 0 },
    oilFit: { aspect: '少油感受', positive: 7, total: 8, disputed: 0 },
    repurchase: { aspect: '正常价复购意愿', positive: 6, total: 8, disputed: 0 },
    growth: { current: 8, threshold: 10 },
    records: [{ id: 'record-1', evidenceType: 'subjective', aspect: '少油感受', result: 'rich', status: 'accepted', occurredAt: '2026-07-20T04:00:00.000Z' }],
  },
  decisionProfile: {
    verdict: '需求最匹配，但证据仍在成长',
    fitFor: '需要独立密封分装、偏好清淡口味的人',
    fitReason: '独立密封分装 8/8，少油感受 7/8 符合。',
    notFor: '只接受大量成熟样本、完全不接受口味波动的人',
    riskReason: '当前只有 8 笔有效订单，且有 1 笔反馈偏油。',
  },
  specifications: [{ label: '牛肉规格', value: '商家标称 80g', source: 'merchant' }],
  dataNotice: '匿名沙盒数据',
})))

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

describe('store detail', () => {
  it('renders API-backed menu, plan and all three evidence layers', async () => {
    const user = userEvent.setup()
    render(<AppProviders><MemoryRouter initialEntries={['/trial/stores/store-beef-01']}><Routes><Route path="/trial/stores/:storeId" element={<StoreDetailPage />} /></Routes></MemoryRouter></AppProviders>)

    expect(await screen.findByRole('heading', { name: '巷口牛肉饭' })).toBeInTheDocument()
    expect(screen.getByText('试新立减4元')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '本店可锁定的承诺' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '试新套餐' })).toBeInTheDocument()
    expect(screen.getAllByTestId('menu-item')).toHaveLength(2)
    await user.click(screen.getByRole('tab', { name: '证据' }))
    expect(screen.getByRole('heading', { name: '这次是否适合你' })).toBeInTheDocument()
    expect(screen.getByText('需要独立密封分装、偏好清淡口味的人')).toBeInTheDocument()
    expect(screen.getByText('只接受大量成熟样本、完全不接受口味波动的人')).toBeInTheDocument()
    expect(screen.getByText('汤饭分装兑现')).toBeInTheDocument()
    expect(screen.queryByText('承诺、感受与规格，分开说清楚')).not.toBeInTheDocument()
    expect(screen.queryByText('这家店的取舍')).not.toBeInTheDocument()
    expect(screen.queryByText('适不适合，不让一句“好吃”说了算')).not.toBeInTheDocument()
  })

  it('opens evidence details and builds an interactive order selection', async () => {
    const user = userEvent.setup()
    render(<AppProviders><MemoryRouter initialEntries={['/trial/stores/store-beef-01']}><Routes><Route path="/trial/stores/:storeId" element={<StoreDetailPage />} /></Routes></MemoryRouter></AppProviders>)

    await screen.findByRole('heading', { name: '巷口牛肉饭' })
    await user.click(screen.getByRole('tab', { name: '证据' }))
    await user.click(screen.getByRole('button', { name: '证据透镜' }))
    expect(screen.getByRole('dialog', { name: '证据透镜' })).toBeInTheDocument()
    expect(screen.getByText(/每条证据均来自完成订单/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '关闭' }))

    await user.click(screen.getByRole('tab', { name: '点菜' }))
    await user.click(screen.getByRole('button', { name: '添加招牌现切牛肉饭' }))
    expect(screen.getByRole('button', { name: '减少招牌现切牛肉饭' })).toBeInTheDocument()
    expect(screen.getByText('已选 1 份')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '确认套餐与承诺' }))
    expect(screen.getByRole('dialog', { name: '确认试新订单' })).toBeInTheDocument()
    expect(screen.getByText('随本单锁定的承诺')).toBeInTheDocument()
  })

  it('keeps ordering primary and switches evidence and merchant information in place', async () => {
    const user = userEvent.setup()
    render(<AppProviders><MemoryRouter initialEntries={['/trial/stores/store-beef-01']}><Routes><Route path="/trial/stores/:storeId" element={<StoreDetailPage />} /></Routes></MemoryRouter></AppProviders>)

    await screen.findByRole('heading', { name: '巷口牛肉饭' })
    expect(screen.getByRole('tab', { name: '点菜' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { name: '本店可锁定的承诺' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: '证据' }))
    expect(screen.getByRole('heading', { name: '真实订单验证' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '试新套餐' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: '商家' }))
    expect(screen.getByRole('heading', { name: '商家信息' })).toBeInTheDocument()
    expect(screen.queryByText('AI 经营建议')).not.toBeInTheDocument()
  })
})
