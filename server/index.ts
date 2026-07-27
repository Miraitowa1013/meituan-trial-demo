import { serve } from '@hono/node-server'
import { count } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { createApp } from './app'
import { serverConfig } from './config'
import { createDatabase } from './db/client'
import { seedDatabase } from './db/seed'
import { stores } from './db/schema'

const database = createDatabase(serverConfig.databaseUrl, serverConfig.databaseAuthToken)

await migrate(database.db, { migrationsFolder: './drizzle' })

const [{ value: storeCount }] = await database.db.select({ value: count() }).from(stores)
if (storeCount === 0) await seedDatabase(database.db)

const app = createApp(database.db)

serve({ fetch: app.fetch, port: serverConfig.apiPort }, (info) => {
  console.log(`Meituan Trial API listening on http://127.0.0.1:${info.port}`)
})

async function shutdown() {
  database.client.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
