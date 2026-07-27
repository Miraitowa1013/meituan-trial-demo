import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AppProviders } from '../../app/AppProviders'
import { ChannelHomePage } from './ChannelHomePage'

const stores = [
  {
    id: 'store-beef-01',
    slug: 'store-beef-01',
    name: '巷口牛肉饭',
    category: '盖饭',
    heroDish: '招牌现切牛肉饭',
    heroImage: '',
    distanceMeters: 680,
    deliveryMinutes: 31,
    averagePrice: 25,
    fromPrice: 23.9,
    evidenceState: 'growing',
    depth: 'deep',
    sandbox: true,
  },
  {
    id: 'store-beef-02',
    slug: 'store-beef-02',
    name: '老灶牛肉盖饭',
    category: '盖饭',
    heroDish: '黑椒牛肉盖饭',
    heroImage: '',
    distanceMeters: 920,
    deliveryMinutes: 29,
    averagePrice: 27,
    fromPrice: 25,
    evidenceState: 'established',
    depth: 'deep',
    sandbox: true,
  },
]

const server = setupServer(
  http.get('/api/stores', () => HttpResponse.json({
    items: stores,
    facets: { categories: ['盖饭'] },
    total: stores.length,
    dataNotice: '匿名沙盒数据',
  })),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="当前位置">{location.pathname}{location.search}</output>
}

function renderChannel() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/trial']}>
        <Routes>
          <Route path="/trial" element={<><ChannelHomePage /><LocationProbe /></>} />
          <Route path="/trial/understand" element={<><h1>正在理解你的需求</h1><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('trial channel v1', () => {
  it('offers active demand and passive discovery in one channel', async () => {
    renderChannel()

    expect(screen.getByRole('heading', { name: '想吃什么，先说清楚' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: '说说这次想吃什么' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '先选什么时候吃' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '早餐' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '筛选' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '附近正在试新' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '高兑现新店' })).not.toBeInTheDocument()
  })

  it('shows evidence and uncertainty directly in each compact store row', async () => {
    renderChannel()

    const cards = await screen.findAllByTestId('store-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('证据成长中')
    expect(cards[0]).toHaveTextContent('样本较少')
    expect(cards[1]).toHaveTextContent('可信稳定')
  })

  it('submits a natural-language demand to the understanding step', async () => {
    const user = userEvent.setup()
    renderChannel()

    const input = screen.getByRole('searchbox', { name: '说说这次想吃什么' })
    await user.type(input, '25元以内牛肉饭，少油，汤别洒')
    await user.click(screen.getByRole('button', { name: '找合适的新店' }))

    expect(await screen.findByRole('heading', { name: '正在理解你的需求' })).toBeInTheDocument()
    expect(screen.getByLabelText('当前位置')).toHaveTextContent(
      '/trial/understand?q=25%E5%85%83%E4%BB%A5%E5%86%85%E7%89%9B%E8%82%89%E9%A5%AD',
    )
  })
})
