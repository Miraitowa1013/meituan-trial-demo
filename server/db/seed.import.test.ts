import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllEnvs())

it('can be imported by the API process without running the seed CLI', async () => {
  vi.stubEnv('NODE_ENV', 'production')

  await expect(import('./seed')).resolves.toHaveProperty('seedDatabase')
})
