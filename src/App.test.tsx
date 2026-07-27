import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('legacy trial demo opening flow', () => {
  beforeEach(() => {
    window.location.hash = '#/legacy/opening'
    localStorage.clear()
  })

  it('moves from the pain point to the mixed trial entry', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: /不是没人想试/ })).toBeVisible()
    await user.click(screen.getByRole('button', { name: '看看怎么放心试新' }))
    expect(await screen.findByRole('heading', { name: '今天想吃什么？' })).toBeVisible()
    expect(screen.getByText('附近正在积累口碑')).toBeVisible()
  })

  it('turns natural language into editable needs and three recommendations', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '看看怎么放心试新' }))
    await user.click(screen.getByRole('button', { name: '帮我找合适的' }))
    expect(await screen.findByText('我理解成这 4 个条件')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /查看 3 个合适选择/ }))
    expect(await screen.findByRole('heading', { name: '没有绝对最好，只有更适合' })).toBeVisible()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('lets every recommendation open its own evidence page', async () => {
    window.location.hash = '#/legacy/recommendations'
    const user = userEvent.setup()
    render(<App />)
    const evidenceButtons = screen.getAllByRole('button', { name: /查看.*证据/ })
    expect(evidenceButtons).toHaveLength(3)
    await user.click(evidenceButtons[1])
    expect(await screen.findByRole('heading', { name: '老灶牛肉盖饭' })).toBeVisible()
    expect(screen.getByText('三类证据，不藏不确定性')).toBeVisible()
  })

  it('completes locking, verification, growth and merchant handoff', async () => {
    window.location.hash = '#/legacy/store/store-beef-01'
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('适合你')).toBeVisible()
    expect(screen.getByText('可能不适合你')).toBeVisible()
    expect(screen.getByText('客观履约')).toBeVisible()
    expect(screen.getByText('主观感受分布')).toBeVisible()
    expect(screen.getByText('真实行为')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '带着承诺去下单' }))
    expect(await screen.findByText('本单承诺已锁定')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '模拟订单已送达' }))
    expect(await screen.findByRole('heading', { name: '20 秒，留下有效验证' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: '提交有效验证' }))
    expect(await screen.findByText('8 → 9')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '加入我的常点' }))
    expect(screen.getByRole('button', { name: '已加入常点' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: '看看商家如何使用这份证据' }))
    expect(await screen.findByRole('heading', { name: '试新经营台' })).toBeVisible()
    expect(screen.getByText('9/9 用户验证分装')).toBeVisible()
  })
})
