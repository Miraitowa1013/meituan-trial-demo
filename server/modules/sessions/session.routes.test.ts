import { expect, it } from 'vitest'
import { createSessionTestApp } from '../../test/create-session-test-app'

it('creates and resets an isolated demo session', async () => {
  const testApp = await createSessionTestApp()

  const created = await testApp.app.request('/api/sessions', { method: 'POST' })
  expect(created.status).toBe(201)
  const session = await created.json() as { id: string; createdAt: string }
  expect(session.id).toMatch(/^demo_/)
  expect(session.createdAt).toBeTruthy()

  const reset = await testApp.app.request(`/api/sessions/${session.id}/reset`, { method: 'POST' })
  expect(reset.status).toBe(200)
  expect(await reset.json()).toMatchObject({ id: session.id, reset: true })

  await testApp.close()
})

it('does not reset another browser session', async () => {
  const testApp = await createSessionTestApp()
  const first = await (await testApp.app.request('/api/sessions', { method: 'POST' })).json() as { id: string }
  const second = await (await testApp.app.request('/api/sessions', { method: 'POST' })).json() as { id: string }

  await testApp.app.request(`/api/sessions/${first.id}/reset`, { method: 'POST' })

  const secondResponse = await testApp.app.request(`/api/sessions/${second.id}`)
  expect(secondResponse.status).toBe(200)
  expect(await secondResponse.json()).toMatchObject({ id: second.id })
  await testApp.close()
})
