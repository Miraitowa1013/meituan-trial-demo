import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AppProviders } from '../../app/AppProviders'
import { ChannelHomePage } from './ChannelHomePage'
import { StoreFeed } from './StoreFeed'
import type { StoreSummary } from '../../shared/api/contracts'

const names = ['巷口牛肉饭', '老灶牛肉盖饭', '禾味鸡汤饭', '拾玖手作面', '青野轻食', '湘里小碗菜', '有间手工饺子', '南麓咖喱所', '潮食砂锅粥', '麦夕烘焙', '山野原叶茶', '小火炭烤']
const stores = names.map((name, index) => ({
  id: `store-${index}`,
  slug: `store-${index}`,
  name,
  category: index < 2 ? '盖饭' : '其他',
  heroDish: index === 0 ? '招牌现切牛肉饭' : `${name}试新套餐`,
  heroImage: '',
  distanceMeters: 420 + index * 90,
  deliveryMinutes: 25 + index,
  averagePrice: index === 4 ? 32 : 24,
  fromPrice: index === 4 ? 26.9 : 19.9,
  evidenceState: index % 3 === 0 ? 'growing' : 'established',
  depth: index < 3 ? 'deep' : 'browse',
  sandbox: true,
}))

const server = setupServer(http.get('/api/stores', ({ request }) => {
  const url = new URL(request.url)
  if (url.searchParams.get('evidenceState') === 'null') return HttpResponse.json({ code: 'INVALID_STORE_QUERY' }, { status: 400 })
  const query = url.searchParams.get('q') ?? ''
  const maxPrice = Number(url.searchParams.get('maxPrice') ?? Infinity)
  const sort = url.searchParams.get('sort')
  const category = url.searchParams.get('category')
  const maxDistance = Number(url.searchParams.get('maxDistance') ?? Infinity)
  const items = stores.filter((store) => `${store.name}${store.heroDish}`.includes(query)
      && store.fromPrice <= maxPrice
      && store.distanceMeters <= maxDistance
      && (!category || store.category === category))
    .sort((a, b) => sort === 'distance'
      ? a.distanceMeters - b.distanceMeters
      : sort === 'evidence'
        ? b.distanceMeters - a.distanceMeters
        : 0)
  return HttpResponse.json({ items, facets: { categories: ['盖饭', '其他'] }, total: items.length, dataNotice: '匿名沙盒数据' })
}))

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('trial channel', () => {
  it('searches and filters a continuous store feed', async () => {
    const user = userEvent.setup()
    render(<AppProviders><MemoryRouter><ChannelHomePage /></MemoryRouter></AppProviders>)

    expect(await screen.findAllByTestId('store-card')).toHaveLength(12)
    await user.type(screen.getByRole('searchbox', { name: '说说这次想吃什么' }), '牛肉')
    expect((await screen.findAllByText('巷口牛肉饭')).length).toBeGreaterThan(0)
    await waitFor(() => expect(screen.queryByText('青野轻食')).not.toBeInTheDocument())

    await user.clear(screen.getByRole('searchbox', { name: '说说这次想吃什么' }))
    await waitFor(() => expect(screen.getAllByTestId('store-card')).toHaveLength(12))
    await user.click(screen.getByRole('button', { name: '25元以内' }))
    expect(await screen.findAllByTestId('store-card')).toHaveLength(11)
    expect(screen.queryByText('青野轻食')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /查看巷口牛肉饭/ })).toHaveAttribute('href', '/trial/stores/store-0')
  })

  it('makes shortcut and sorting controls produce visible results', async () => {
    const user = userEvent.setup()
    function LocationProbe() {
      const location = useLocation()
      return <output aria-label="current-location">{location.pathname}{location.search}</output>
    }
    render(<AppProviders><MemoryRouter initialEntries={['/trial']}><Routes>
      <Route path="/trial" element={<><ChannelHomePage /><LocationProbe /></>} />
      <Route path="/me" element={<h1>我的试新</h1>} />
    </Routes></MemoryRouter></AppProviders>)

    await screen.findAllByTestId('store-card')
    await user.click(screen.getByRole('button', { name: '晚餐' }))
    expect(screen.getByLabelText('current-location')).toHaveTextContent('mealPeriod=dinner')
    await user.click(screen.getByRole('button', { name: '盖饭' }))
    expect(screen.getByLabelText('current-location')).toHaveTextContent('category=%E7%9B%96%E9%A5%AD')
    await user.click(screen.getByRole('button', { name: '25元以内' }))
    expect(screen.getByLabelText('current-location')).toHaveTextContent('maxPrice=25')
    await user.click(screen.getByRole('button', { name: '离我最近' }))
    expect(screen.getByLabelText('current-location')).toHaveTextContent('sort=distance')
    expect(screen.queryByRole('button', { name: /高兑现新店/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /我的试新/ }))
    expect(await screen.findByRole('heading', { name: '我的试新' })).toBeInTheDocument()
  })

  it('opens advanced filters and applies a distance independently', async () => {
    const user = userEvent.setup()
    function LocationProbe() {
      const location = useLocation()
      return <output aria-label="current-location">{location.pathname}{location.search}</output>
    }
    render(<AppProviders><MemoryRouter initialEntries={['/trial']}><><ChannelHomePage /><LocationProbe /></></MemoryRouter></AppProviders>)

    await screen.findAllByTestId('store-card')
    await user.click(screen.getByRole('button', { name: '筛选' }))
    expect(screen.getByRole('dialog', { name: '更多筛选' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '1公里内' }))
    expect(screen.getByLabelText('current-location')).toHaveTextContent('maxDistance=1000')
    await user.click(screen.getByRole('button', { name: '完成筛选' }))
    expect(screen.queryByRole('dialog', { name: '更多筛选' })).not.toBeInTheDocument()
  })

  it('introduces nearby trial stores before secondary discovery controls', async () => {
    render(<AppProviders><MemoryRouter><ChannelHomePage /></MemoryRouter></AppProviders>)

    await screen.findAllByTestId('store-card')
    const nearbyHeading = screen.getByRole('heading', { name: '附近正在试新' })
    const mealControls = screen.getByRole('region', { name: '先选什么时候吃' })

    expect(nearbyHeading.compareDocumentPosition(mealControls) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('uses one demand entry and one unified nearby store list', async () => {
    render(<AppProviders><MemoryRouter><ChannelHomePage /></MemoryRouter></AppProviders>)

    await screen.findAllByTestId('store-card')
    expect(screen.queryByRole('button', { name: /AI 说需求/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '附近可信新店榜' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '附近正在试新' })).toBeInTheDocument()
  })

  it('uses one consistent trust-state vocabulary across store cards', async () => {
    render(<AppProviders><MemoryRouter><ChannelHomePage /></MemoryRouter></AppProviders>)

    await screen.findAllByTestId('store-card')
    expect(screen.getAllByText('可信稳定').length).toBeGreaterThan(0)
    expect(screen.getAllByText('证据成长中').length).toBeGreaterThan(0)
    expect(screen.queryByText('履约较稳定')).not.toBeInTheDocument()
  })

  it('falls back to the category illustration when a store image URL is not usable', () => {
    render(<MemoryRouter><StoreFeed stores={[{ ...stores[0], heroImage: '/missing-food.jpg' } as StoreSummary]} /></MemoryRouter>)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('盖饭')).toBeVisible()
  })
})
