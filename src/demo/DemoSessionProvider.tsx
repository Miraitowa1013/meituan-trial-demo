import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { apiRequest } from '../shared/api/http'
import type { DemoSession } from '../shared/api/contracts'

const storageKey = 'meituan-trial:session'

type DemoSessionContextValue = {
  sessionId?: string
  status: 'loading' | 'ready' | 'error'
  reset: () => Promise<void>
}

const DemoSessionContext = createContext<DemoSessionContextValue | null>(null)

async function createSession() {
  return apiRequest<DemoSession>('/sessions', { method: 'POST' })
}

export function DemoSessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [sessionId, setSessionId] = useState<string>()
  const [status, setStatus] = useState<DemoSessionContextValue['status']>('loading')

  useEffect(() => {
    let active = true

    async function restore() {
      try {
        const storedId = localStorage.getItem(storageKey)
        let session: DemoSession
        if (storedId) {
          try {
            session = await apiRequest<DemoSession>(`/sessions/${encodeURIComponent(storedId)}`)
          } catch {
            localStorage.removeItem(storageKey)
            session = await createSession()
          }
        } else {
          session = await createSession()
        }

        if (!active) return
        localStorage.setItem(storageKey, session.id)
        setSessionId(session.id)
        setStatus('ready')
      } catch {
        if (active) setStatus('error')
      }
    }

    void restore()
    return () => { active = false }
  }, [])

  const value = useMemo<DemoSessionContextValue>(() => ({
    sessionId,
    status,
    async reset() {
      if (!sessionId) return
      await apiRequest(`/sessions/${encodeURIComponent(sessionId)}/reset`, { method: 'POST' })
      await queryClient.invalidateQueries()
    },
  }), [queryClient, sessionId, status])

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext)
  if (!context) throw new Error('useDemoSession must be used inside DemoSessionProvider')
  return context
}

export function useOptionalDemoSession() {
  return useContext(DemoSessionContext)
}
