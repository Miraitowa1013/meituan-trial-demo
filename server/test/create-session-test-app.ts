import { Hono } from 'hono'
import { randomUUID } from 'node:crypto'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { createDatabase } from '../db/client'
import { createSessionRoutes } from '../modules/sessions/session.routes'
import { createSessionService } from '../modules/sessions/session.service'

export async function createSessionTestApp() {
  const database = createDatabase(`file:./data/session-test-${randomUUID()}.db`)
  await migrate(database.db, { migrationsFolder: './drizzle' })
  const app = new Hono().route('/api/sessions', createSessionRoutes(createSessionService(database.db)))

  return {
    app,
    close: async () => database.client.close(),
  }
}
