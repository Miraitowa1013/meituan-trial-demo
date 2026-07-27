import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useOptionalDemoSession } from '../demo/DemoSessionProvider'

const navItems = [
  { to: '/trial', label: '试新' },
  { to: '/me', label: '我的' },
]

export function ConsumerLayout() {
  const session = useOptionalDemoSession()
  const [resetMessage, setResetMessage] = useState('')

  const reset = async () => {
    await session?.reset()
    setResetMessage('当前体验空间已重置')
    window.setTimeout(() => setResetMessage(''), 1800)
  }

  return (
    <div className="consumer-shell">
      <Outlet />
      {session && <details className="demo-reset">
        <summary aria-label="展开体验工具">•••</summary>
        <button type="button" onClick={reset} disabled={session.status !== 'ready'}>重置体验数据</button>
      </details>}
      {resetMessage && <div className="demo-reset-toast" role="status">{resetMessage}</div>}
      <nav className="consumer-nav" aria-label="试新频道导航">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
        ))}
      </nav>
    </div>
  )
}
