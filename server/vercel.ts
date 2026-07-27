import { count } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { handle } from 'hono/vercel'
import { createApp } from './app'
import { createDatabase } from './db/client'
import { seedDatabase } from './db/seed'
import { stores } from './db/schema'

const databaseUrl = process.env.DATABASE_URL || 'file:/tmp/meituan-trial-demo.db'
const database = createDatabase(databaseUrl, process.env.DATABASE_AUTH_TOKEN)

const ready = (async () => {
  await migrate(database.db, { migrationsFolder: './drizzle' })
  const [{ value: storeCount }] = await database.db.select({ value: count() }).from(stores)
  if (storeCount === 0) await seedDatabase(database.db)
})()

const app = createApp(database.db)
const honoHandler = handle(app)

async function handler(request: Request) {
  await ready
  return honoHandler(request)
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
