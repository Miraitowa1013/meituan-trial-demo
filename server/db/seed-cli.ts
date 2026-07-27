import { serverConfig } from '../config'
import { createDatabase } from './client'
import { seedStores } from './seed-data'
import { seedDatabase } from './seed'

const { client, db } = createDatabase(serverConfig.databaseUrl, serverConfig.databaseAuthToken)
await seedDatabase(db)
client.close()

console.log(`Seeded ${seedStores.length} anonymous stores.`)
