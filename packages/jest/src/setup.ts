import { matchers } from './matchers/index.js'

export interface SetupOptions {
  timezone?: string
  suppressLogs?: boolean
}

/**
 * Sets up the serverless testing environment for Jest.
 * - Registers custom matchers via expect.extend()
 * - Optionally sets process.env.TZ
 * - Optionally suppresses console.log and console.warn
 *
 * Returns a cleanup function that restores all original values.
 */
export function setupServerlessTesting(options: SetupOptions = {}): () => void {
  // Register matchers
  expect.extend(matchers)

  const originalTZ = process.env.TZ
  const originalConsoleLog = console.log
  const originalConsoleWarn = console.warn

  if (options.timezone) {
    process.env.TZ = options.timezone
  }

  if (options.suppressLogs) {
    console.log = jest.fn()
    console.warn = jest.fn()
  }

  // Return cleanup function
  return () => {
    if (options.timezone) {
      if (originalTZ === undefined) {
        delete process.env.TZ
      } else {
        process.env.TZ = originalTZ
      }
    }

    if (options.suppressLogs) {
      console.log = originalConsoleLog
      console.warn = originalConsoleWarn
    }
  }
}
