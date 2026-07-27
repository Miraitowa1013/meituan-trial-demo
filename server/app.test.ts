import { randomUUID } from 'node:crypto'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from './app'
import { createDatabase } from './db/client'
import { seedDatabase } from './db/seed'

const openDatabases: Array<ReturnType<typeof createDatabase>> = []

afterEach(async () => {
  await Promise.all(openDatabases.splice(0).map(({ client }) => client.close()))
})

async function createTestApp() {
  const database = createDatabase(`file:./data/app-test-${randomUUID()}.db`)
  openDatabases.push(database)
  await migrate(database.db, { migrationsFolder: './drizzle' })
  await seedDatabase(database.db)
  return createApp(database.db)
}

describe('application API', () => {
  it('reports API and database readiness', async () => {
    const app = await createTestApp()

    const response = await app.request('/api/health')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'ok',
      database: 'ready',
      service: 'meituan-trial-api',
    })
  })

  it('mounts session and store routes under one application', async () => {
    const app = await createTestApp()

    const sessionResponse = await app.request('/api/sessions', { method: 'POST' })
    const storesResponse = await app.request('/api/stores?category=盖饭')

    expect(sessionResponse.status).toBe(201)
    expect(storesResponse.status).toBe(200)
    await expect(storesResponse.json()).resolves.toMatchObject({ total: 3 })
  })

  it('returns a stable JSON error for unknown API routes', async () => {
    const app = await createTestApp()

    const response = await app.request('/api/unknown')

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ code: 'API_ROUTE_NOT_FOUND' })
  })
})
