import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface FunctionMetadata {
  handler: string
  name: string
  memorySize?: number
  timeout?: number
  runtime?: string
  environment?: Record<string, string>
  events?: unknown[]
}

export interface TestingConfig {
  service: string
  stage: string
  region: string
  functions: Record<string, FunctionMetadata>
}

/**
 * Generates sls-testing.config.json with resolved function metadata.
 */
export function generateConfig(config: TestingConfig, outputDir: string): string {
  const outputPath = resolve(outputDir, 'sls-testing.config.json')
  writeFileSync(outputPath, JSON.stringify(config, null, 2), 'utf-8')
  return outputPath
}
