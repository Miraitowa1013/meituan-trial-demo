import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import * as schema from './schema'

export function createDatabase(url: string, authToken?: string) {
  if (url.startsWith('file:')) {
    const databasePath = url.slice('file:'.length)
    mkdirSync(dirname(databasePath), { recursive: true })
  }

  const client = createClient({
    url,
    ...(authToken ? { authToken } : {}),
  })

  return {
    client,
    db: drizzle(client, { schema }),
  }
}

export type AppDatabase = ReturnType<typeof createDatabase>['db']
