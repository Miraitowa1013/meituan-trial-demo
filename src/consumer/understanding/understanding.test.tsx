import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AppProviders } from '../../app/AppProviders'
import { UnderstandingPage } from './UnderstandingPage'

const parsedDemand = {
  budgetMax: 25,
  category: '牛肉饭',
  taste: ['偏清淡'],
  fulfillmentNeeds: [{
    raw: '汤别洒',
    normalized: '汤与米饭使用独立密封容器',
    responsibleParty: 'merchant',
  }],
  source: 'fallback',
}

const server = setupServer(
  http.post('/api/ai/parse-demand', () => HttpResponse.json(parsedDemand)),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="当前位置">{location.pathname}{location.search}</output>
}

function renderPage() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/trial/understand?q=25元以内牛肉饭，少油，汤别洒']}>
        <Routes>
          <Route path="/trial/understand" element={<><UnderstandingPage /><LocationProbe /></>} />
          <Route path="/trial/recommendations" element={<><h1>为你找到 3 个选择</h1><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('AI understanding step', () => {
  it('shows semantic translation and lets the user revise it', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('汤别洒')).toBeInTheDocument()
    expect(screen.getByText('汤与米饭使用独立密封容器')).toBeInTheDocument()
    expect(screen.getByText('AI 将配送顾虑改写为商家可控条件')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '删除偏清淡' }))
    expect(screen.queryByText('偏清淡')).not.toBeInTheDocument()
    expect(screen.getByText('预计找到 5 家')).toBeInTheDocument()
  })

  it('continues with the confirmed structured demand', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '查看 3 个合适选择' }))
    expect(await screen.findByRole('heading', { name: '为你找到 3 个选择' })).toBeInTheDocument()
    expect(screen.getByLabelText('当前位置')).toHaveTextContent('/trial/recommendations')
  })
})
