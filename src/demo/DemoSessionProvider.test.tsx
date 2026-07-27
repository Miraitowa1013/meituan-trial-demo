import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppProviders } from '../app/AppProviders'
import { DemoSessionProvider, useDemoSession } from './DemoSessionProvider'

let createCalls = 0

const server = setupServer(
  http.post('/api/sessions', () => {
    createCalls += 1
    return HttpResponse.json({
      id: 'demo_test',
      createdAt: '2026-07-22T00:00:00.000Z',
      resetAt: '2026-07-22T00:00:00.000Z',
    }, { status: 201 })
  }),
  http.get('/api/sessions/:id', ({ params }) => HttpResponse.json({
    id: params.id,
    createdAt: '2026-07-22T00:00:00.000Z',
    resetAt: '2026-07-22T00:00:00.000Z',
  })),
)

function SessionProbe() {
  const { sessionId, status } = useDemoSession()
  return <span>{status === 'ready' ? sessionId : status}</span>
}

function renderProvider() {
  return render(
    <AppProviders>
      <DemoSessionProvider>
        <SessionProbe />
      </DemoSessionProvider>
    </AppProviders>,
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
  createCalls = 0
})
afterAll(() => server.close())

describe('DemoSessionProvider', () => {
  it('creates one browser session and persists its id', async () => {
    renderProvider()

    expect(await screen.findByText('demo_test')).toBeInTheDocument()
    expect(localStorage.getItem('meituan-trial:session')).toBe('demo_test')
    expect(createCalls).toBe(1)
  })

  it('reuses a valid persisted session instead of creating another', async () => {
    localStorage.setItem('meituan-trial:session', 'demo_existing')

    renderProvider()

    expect(await screen.findByText('demo_existing')).toBeInTheDocument()
    expect(createCalls).toBe(0)
  })

  it('creates a fresh session when the persisted session no longer exists', async () => {
    localStorage.setItem('meituan-trial:session', 'demo_stale')
    server.use(
      http.get('/api/sessions/demo_stale', () => HttpResponse.json({ message: 'not found' }, { status: 404 })),
    )

    renderProvider()

    expect(await screen.findByText('demo_test')).toBeInTheDocument()
    expect(localStorage.getItem('meituan-trial:session')).toBe('demo_test')
    expect(createCalls).toBe(1)
  })
})
