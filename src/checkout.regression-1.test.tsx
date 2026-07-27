import { render, screen } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { HashRouter } from 'react-router-dom'
import LegacyDemo from './legacy/LegacyDemo'

function App() {
  return <HashRouter><LegacyDemo /></HashRouter>
}

beforeEach(() => localStorage.clear())

// Regression: ISSUE-001 — alternate recommendation reverted to hero store at checkout
// Found by /qa on 2026-07-21
// Report: .gstack/qa-reports/qa-report-localhost-2026-07-21.md
it('keeps the selected alternate store when checkout opens', async () => {
  window.location.hash = '#/checkout?store=store-beef-02'
  render(<App />)
  expect(await screen.findByText('黑椒牛肉盖饭')).toBeVisible()
  expect(screen.queryByText('招牌现切牛肉饭')).not.toBeInTheDocument()
})
