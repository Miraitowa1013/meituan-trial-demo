export interface DeploymentDatabaseOptions {
  configuredUrl?: string
  seedPath: string
  runtimePath: string
}

export function prepareDeploymentDatabase(options: DeploymentDatabaseOptions) {
  if (options.configuredUrl) return options.configuredUrl
  if (!existsSync(options.runtimePath)) copyFileSync(options.seedPath, options.runtimePath)
  return `file:${options.runtimePath}`
}
import { copyFileSync, existsSync } from 'node:fs'
