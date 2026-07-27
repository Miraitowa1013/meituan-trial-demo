import { describe, expect, it } from 'vitest'
import { parseServerConfig } from './config'

describe('parseServerConfig', () => {
  it('uses safe local defaults', () => {
    expect(parseServerConfig({})).toMatchObject({
      databaseUrl: 'file:./data/trial-demo.db',
      apiPort: 8787,
      llmProvider: 'fallback',
    })
  })

  it('rejects an invalid API port', () => {
    expect(() => parseServerConfig({ API_PORT: 'abc' })).toThrow('API_PORT')
  })

  it('accepts a provider-neutral DeepSeek configuration', () => {
    expect(parseServerConfig({
      LLM_PROVIDER: 'deepseek',
      DEEPSEEK_API_KEY: 'server-only-key',
    })).toMatchObject({
      llmProvider: 'deepseek',
      deepseekApiKey: 'server-only-key',
    })
  })
})
