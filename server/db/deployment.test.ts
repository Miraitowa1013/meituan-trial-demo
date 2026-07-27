import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { prepareDeploymentDatabase } from './deployment'

describe('prepareDeploymentDatabase', () => {
  it('copies the packaged seed database instead of migrating and seeding on cold start', () => {
    const directory = mkdtempSync(join(tmpdir(), 'meituan-deploy-db-'))
    const seedPath = join(directory, 'seed.sqlite')
    const runtimePath = join(directory, 'runtime.sqlite')
    writeFileSync(seedPath, 'ready database')

    const databaseUrl = prepareDeploymentDatabase({
      configuredUrl: undefined,
      seedPath,
      runtimePath,
    })

    expect(databaseUrl).toBe(`file:${runtimePath}`)
    expect(readFileSync(runtimePath, 'utf8')).toBe('ready database')
  })
})
