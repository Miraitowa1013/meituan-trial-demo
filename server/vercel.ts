import { handle } from 'hono/vercel'
import { join } from 'node:path'
import { createApp } from './app'
import { createDatabase } from './db/client'
import { prepareDeploymentDatabase } from './db/deployment'

const databaseUrl = prepareDeploymentDatabase({
  configuredUrl: process.env.DATABASE_URL,
  seedPath: join(process.cwd(), 'server/assets/deploy-seed.sqlite'),
  runtimePath: '/tmp/meituan-trial-demo.db',
})
const database = createDatabase(databaseUrl, process.env.DATABASE_AUTH_TOKEN)

const app = createApp(database.db)
const honoHandler = handle(app)

async function handler(request: Request) {
  const incomingUrl = new URL(request.url)
  const route = incomingUrl.searchParams.get('__route')
  if (!route) return honoHandler(request)

  incomingUrl.pathname = `/api/${route}`
  incomingUrl.searchParams.delete('__route')
  return honoHandler(new Request(incomingUrl, request))
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
