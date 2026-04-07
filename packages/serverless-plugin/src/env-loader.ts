import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Loads environment variables from a file into process.env.
 * Each line should be in KEY=VALUE format. Lines starting with # are comments.
 */
export function loadEnvFile(filePath: string, cwd: string): void {
  const fullPath = resolve(cwd, filePath)

  if (!existsSync(fullPath)) {
    console.warn(`[serverless-testing-plugin] Warning: env file not found: ${fullPath}`)
    return
  }

  const content = readFileSync(fullPath, 'utf-8')
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()

    // Remove surrounding quotes if present
    const unquoted = value.replace(/^["']|["']$/g, '')
    process.env[key] = unquoted
  }
}
