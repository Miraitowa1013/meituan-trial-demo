import { migrate } from 'drizzle-orm/libsql/migrator'
import { serverConfig } from '../config'
import { createDatabase } from './client'

const { client, db } = createDatabase(serverConfig.databaseUrl, serverConfig.databaseAuthToken)

await migrate(db, { migrationsFolder: './drizzle' })
client.close()

console.log('Database migrations applied.')
