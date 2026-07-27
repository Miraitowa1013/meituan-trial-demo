import { randomUUID } from 'node:crypto'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { Hono } from 'hono'
import { createDatabase } from '../db/client'
import { seedDatabase } from '../db/seed'
import { createStoreRoutes } from '../modules/stores/store.routes'
import { createStoreService } from '../modules/stores/store.service'

export async function createStoreTestApp() {
  const database = createDatabase(`file:./data/store-test-${randomUUID()}.db`)
  await migrate(database.db, { migrationsFolder: './drizzle' })
  await seedDatabase(database.db)
  const app = new Hono().route('/api/stores', createStoreRoutes(createStoreService(database.db)))
  return { app, close: async () => database.client.close() }
}
