import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const databasePath = resolve(process.cwd(), 'data', 'e2e.db')

for (const suffix of ['', '-shm', '-wal']) {
  await rm(`${databasePath}${suffix}`, { force: true })
}
