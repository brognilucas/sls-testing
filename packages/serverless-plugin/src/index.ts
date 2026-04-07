import { ServerlessTestingPlugin } from './plugin.js'

export { ServerlessTestingPlugin } from './plugin.js'
export { loadEnvFile } from './env-loader.js'
export { generateConfig } from './config-generator.js'
export type { FunctionMetadata, TestingConfig } from './config-generator.js'

// Default export for Serverless Framework plugin resolution
export default ServerlessTestingPlugin
