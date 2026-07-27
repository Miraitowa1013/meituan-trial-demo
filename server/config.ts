import { z } from 'zod'

const environmentSchema = z.object({
  DATABASE_URL: z.string().min(1).default('file:./data/trial-demo.db'),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  API_PORT: z.coerce.number().int().positive().max(65_535).default(8787),
  LLM_PROVIDER: z.enum(['fallback', 'deepseek']).default('fallback'),
  DEEPSEEK_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().default('https://api.deepseek.com'),
  AI_MODEL: z.string().min(1).default('deepseek-chat'),
})

export function parseServerConfig(environment: Record<string, string | undefined>) {
  const parsed = environmentSchema.parse(environment)

  return {
    databaseUrl: parsed.DATABASE_URL,
    databaseAuthToken: parsed.DATABASE_AUTH_TOKEN,
    apiPort: parsed.API_PORT,
    llmProvider: parsed.LLM_PROVIDER,
    deepseekApiKey: parsed.DEEPSEEK_API_KEY,
    aiBaseUrl: parsed.AI_BASE_URL,
    aiModel: parsed.AI_MODEL,
  } as const
}

export const serverConfig = parseServerConfig(process.env)
