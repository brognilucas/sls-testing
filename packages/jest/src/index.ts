// Auto-register matchers on import
import { matchers } from './matchers/index.js'

// Register matchers so `import '@sls-testing/jest'` is enough
expect.extend(matchers)

// Re-export setup helper
export { setupServerlessTesting } from './setup.js'
export type { SetupOptions } from './setup.js'

// Re-export matchers for manual use
export { matchers } from './matchers/index.js'
export {
  toHaveStatusCode,
  toBeSuccessfulApiResponse,
  toBeClientError,
  toBeServerError,
  toMatchLambdaResponse,
  toHaveNoFailedMessages,
  toHaveFailedMessage,
  toHaveNoSideEffects,
} from './matchers/index.js'

// Re-export types
export type {} from './types/jest.js'
