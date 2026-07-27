import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProviders } from '../../app/AppProviders'
import { DemoSessionProvider } from '../../demo/DemoSessionProvider'
import { CheckoutPage } from '../checkout/CheckoutPage'
import { OrderDetailPage } from './OrderDetailPage'
import { OrdersPage } from './OrdersPage'
import { MyTrialPage } from '../profile/MyTrialPage'

const order = {
  id: 'order-1', sessionId: 'demo-test', storeId: 'store-beef-01', status: 'created', totalAmount: 23.9, sandbox: true,
  createdAt: '2026-07-22T00:00:00.000Z', updatedAt: '2026-07-22T00:00:00.000Z',
  store: { id: 'store-beef-01', name: '巷口牛肉饭', heroDish: '招牌现切牛肉饭' },
  items: [{ id: 'item-1', menuItemId: 'menu-1', name: '招牌现切牛肉饭试新套餐', unitPrice: 23.9, quantity: 1 }],
  promises: [{ id: 'promise-1', aspect: '汤饭分装', version: 1, merchantConfirmedAt: '2026-07-22T00:00:00.000Z' }],
}
const completedOrder = {
  ...order,
  id: 'order-2',
  status: 'completed',
  totalAmount: 25.9,
  verification: {
    id: 'verification-2',
    objectiveResult: 'fulfilled',
    tasteResult: 'light',
    repurchaseIntent: 'yes',
    note: null,
    imagePath: null,
    createdAt: '2026-07-22T00:20:00.000Z',
    items: [{ promiseSnapshotId: 'promise-1', result: 'fulfilled' }],
  },
}

let advanceCount = 0
const demoStatuses = ['preparing', 'delivering', 'delivered', 'pending_verification'] as const

const server = setupServer(
  http.post('/api/sessions', () => HttpResponse.json({ id: 'demo-test', createdAt: '2026-07-22T00:00:00.000Z', resetAt: '2026-07-22T00:00:00.000Z' }, { status: 201 })),
  http.get('/api/stores/store-beef-01', () => HttpResponse.json({
    id: 'store-beef-01', name: '巷口牛肉饭', menu: [{ id: 'menu-1', storeId: 'store-beef-01', name: '招牌现切牛肉饭试新套餐', price: 23.9, isTrial: true }],
    evidence: [{ id: 'ev-1', evidenceType: 'objective', aspect: '汤饭分装' }], dataNotice: '匿名沙盒数据',
  })),
  http.post('/api/orders', () => HttpResponse.json(order, { status: 201 })),
  http.get('/api/orders', () => HttpResponse.json({ items: [order, completedOrder] })),
  http.get('/api/orders/:id', ({ params }) => HttpResponse.json(params.id === 'order-2' ? completedOrder : order)),
  http.post('/api/orders/order-1/advance', () => {
    const status = demoStatuses[Math.min(advanceCount, demoStatuses.length - 1)]
    advanceCount += 1
    return HttpResponse.json({ ...order, status })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  localStorage.clear()
  advanceCount = 0
})

function renderFlow(path: string) {
  return render(<AppProviders><DemoSessionProvider><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/orders" element={<OrdersPage />} />
    <Route path="/orders/:orderId" element={<OrderDetailPage />} />
    <Route path="/orders/:orderId/verify" element={<h1>餐后反馈页面已打开</h1>} />
  </Routes></MemoryRouter></DemoSessionProvider></AppProviders>)
}

it('creates a sandbox order from a server-validated checkout', async () => {
  const user = userEvent.setup()
  renderFlow('/checkout?storeId=store-beef-01&item=menu-1:1')
  expect(await screen.findByRole('heading', { name: '确认订单' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '本单承诺' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '提交订单' }))
  expect(await screen.findByRole('heading', { name: '试新订单详情' })).toBeInTheDocument()
  expect(screen.getByText('试新保障订单')).toBeInTheDocument()
})

it('explains what is locked now and what happens after delivery', async () => {
  renderFlow('/checkout?storeId=store-beef-01&item=menu-1:1')
  expect(await screen.findByText('下单前')).toBeInTheDocument()
  expect(screen.getAllByText('商家承诺随订单锁定')).toHaveLength(2)
  expect(screen.getByText('收餐后')).toBeInTheDocument()
  expect(screen.getByText('用 20 秒验证真实履约')).toBeInTheDocument()
})

it('lists shared API orders and advances one demo state', async () => {
  const user = userEvent.setup()
  renderFlow('/orders')
  expect(await screen.findAllByText('巷口牛肉饭')).toHaveLength(2)
  await user.click(screen.getAllByRole('link', { name: '查看订单' })[0])
  expect(await screen.findByRole('heading', { name: '试新订单详情' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '推进订单状态' }))
  expect(await screen.findByText('商家制作中')).toBeInTheDocument()
})

it('filters orders by meaningful status tabs', async () => {
  const user = userEvent.setup()
  renderFlow('/orders')

  expect(await screen.findByRole('button', { name: /全部 2/ })).toBeInTheDocument()
  expect(screen.getAllByText('巷口牛肉饭')).toHaveLength(2)
  await user.click(screen.getByRole('button', { name: /已完成 1/ }))
  expect(screen.getAllByText('巷口牛肉饭')).toHaveLength(1)
  expect(screen.getAllByText('已完成')).toHaveLength(2)
  await user.click(screen.getByRole('button', { name: /争议中 0/ }))
  expect(screen.getByText('当前没有争议中的订单')).toBeInTheDocument()
})

it('keeps the submitted verification visible on a completed order', async () => {
  renderFlow('/orders/order-2')
  expect(await screen.findByRole('heading', { name: '本次验证结果' })).toBeInTheDocument()
  expect(screen.getByText('已兑现')).toBeInTheDocument()
  expect(screen.getByText('偏清淡')).toBeInTheDocument()
  expect(screen.getByText('愿意正常价再点')).toBeInTheDocument()
})

it('offers a visible one-click path from a new order to餐后验证', async () => {
  const user = userEvent.setup()
  renderFlow('/orders/order-1')
  expect(await screen.findByRole('heading', { name: '试新订单详情' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '模拟送达，开始验证' }))
  expect(await screen.findByRole('heading', { name: '餐后反馈页面已打开' })).toBeInTheDocument()
})

it('keeps demo controls secondary to the real order progress', async () => {
  renderFlow('/orders/order-1')
  expect(await screen.findByText('订单进度')).toBeInTheDocument()
  expect(screen.getByText('已下单')).toBeInTheDocument()
  expect(screen.getByText('待验证')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '模拟送达，开始验证' })).toBeInTheDocument()
})

it('shows real verification and repurchase summaries on my trial page', async () => {
  render(
    <AppProviders>
      <DemoSessionProvider>
        <MemoryRouter initialEntries={['/me']}>
          <Routes>
            <Route path="/me" element={<MyTrialPage />} />
          </Routes>
        </MemoryRouter>
      </DemoSessionProvider>
    </AppProviders>,
  )

  expect(screen.getByText('已完成验证')).toBeInTheDocument()
  expect(await screen.findByText('1 份')).toBeInTheDocument()
  expect(screen.getByText('愿意正常价再点')).toBeInTheDocument()
  expect(screen.getByText('1 家')).toBeInTheDocument()
})
