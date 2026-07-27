import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createDatabase } from './client'

describe('createDatabase', () => {
  it('creates the parent directory for a local database', async () => {
    const root = await mkdtemp(join(tmpdir(), 'meituan-trial-'))
    const nestedDatabase = join(root, 'nested', 'trial.db').replaceAll('\\', '/')

    const database = createDatabase(`file:${nestedDatabase}`)
    await expect(database.client.execute('select 1')).resolves.toBeDefined()

    await database.client.close()
  })
})
