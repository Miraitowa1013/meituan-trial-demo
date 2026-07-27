import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { Drawer } from './Drawer'
import { Tag } from './Tag'
import { Toast } from './Toast'

describe('locked trial UI primitives', () => {
  it('supports primary, secondary and disabled button states', () => {
    const { rerender } = render(<Button variant="primary">开始试新</Button>)
    expect(screen.getByRole('button', { name: '开始试新' })).toHaveClass('ui-button--primary')

    rerender(<Button variant="secondary">修改需求</Button>)
    expect(screen.getByRole('button', { name: '修改需求' })).toHaveClass('ui-button--secondary')

    rerender(<Button disabled>继续</Button>)
    expect(screen.getByRole('button', { name: '继续' })).toBeDisabled()
  })

  it('renders semantic evidence tags', () => {
    render(<><Tag tone="verified">已验证</Tag><Tag tone="uncertain">样本成长中</Tag><Tag tone="risk">存在分歧</Tag></>)
    expect(screen.getByText('已验证')).toHaveClass('ui-tag--verified')
    expect(screen.getByText('样本成长中')).toHaveClass('ui-tag--uncertain')
    expect(screen.getByText('存在分歧')).toHaveClass('ui-tag--risk')
  })

  it('opens and closes the drawer accessibly', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Drawer open title="为什么推荐它" onClose={onClose}>证据内容</Drawer>)
    expect(screen.getByRole('dialog', { name: '为什么推荐它' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: '关闭' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('announces toast messages', () => {
    render(<Toast message="已加入我的常点" />)
    expect(screen.getByRole('status')).toHaveTextContent('已加入我的常点')
  })
})
