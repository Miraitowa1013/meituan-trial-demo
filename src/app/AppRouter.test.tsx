import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from './AppProviders'
import { AppRouter } from './AppRouter'

function renderRouter(path: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('formal trial channel routes', () => {
  it('enters the trial channel from the Meituan home entry', async () => {
    const user = userEvent.setup()
    renderRouter('/meituan')

    expect(screen.getByRole('heading', { name: '美团外卖' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: '试新，新店也有可信依据' }))
    expect(await screen.findByRole('heading', { name: '想吃什么，先说清楚' })).toBeInTheDocument()
  })

  it('uses the Meituan entry as the product root', async () => {
    renderRouter('/')

    expect(await screen.findByRole('heading', { name: '美团外卖' })).toBeInTheDocument()
  })

  it('opens the trial channel instead of a linear opening slide', () => {
    renderRouter('/trial')

    expect(screen.getByRole('heading', { name: '想吃什么，先说清楚' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '试新频道导航' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '下一步' })).not.toBeInTheDocument()
  })

  it('keeps primary sections addressable', () => {
    renderRouter('/me')
    expect(screen.getByRole('heading', { name: '我的试新' })).toBeInTheDocument()
    expect(screen.getByText('我的订单')).toBeInTheDocument()
  })
})
