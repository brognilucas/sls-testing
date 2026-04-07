import { loadEnvFile } from './env-loader.js'
import { generateConfig } from './config-generator.js'
import type { FunctionMetadata, TestingConfig } from './config-generator.js'

interface ServerlessFunction {
  handler: string
  name?: string
  memorySize?: number
  timeout?: number
  runtime?: string
  environment?: Record<string, string>
  events?: unknown[]
}

interface ServerlessInstance {
  service: {
    service: string
    functions: Record<string, ServerlessFunction>
    provider: {
      stage: string
      region: string
    }
  }
  config: {
    servicePath: string
  }
}

interface ServerlessTestingConfig {
  envFile?: string
  autoLoadEnv?: boolean
}

export class ServerlessTestingPlugin {
  private serverless: ServerlessInstance
  private options: Record<string, unknown>
  private config: ServerlessTestingConfig

  hooks: Record<string, () => void | Promise<void>>
  commands: Record<string, unknown>

  constructor(serverless: ServerlessInstance, options: Record<string, unknown>) {
    this.serverless = serverless
    this.options = options
    this.config = (
      (serverless.service as unknown as Record<string, unknown>).custom as Record<string, unknown> | undefined
    )?.serverlessTesting as ServerlessTestingConfig ?? {}

    this.commands = {
      test: {
        usage: 'Run tests with serverless context',
        lifecycleEvents: ['setup', 'run'],
      },
    }

    this.hooks = {
      'test:setup': () => this.setupTestEnvironment(),
      'test:run': () => this.runTests(),
    }
  }

  /**
   * Get metadata for a specific function defined in serverless.yml.
   */
  getFunction(name: string): FunctionMetadata {
    const functions = this.serverless.service.functions
    const fn = functions[name]

    if (!fn) {
      const available = Object.keys(functions).join(', ')
      throw new Error(
        `[serverless-testing-plugin] Function "${name}" not found. Available functions: ${available}`,
      )
    }

    return {
      handler: fn.handler,
      name: fn.name ?? `${this.serverless.service.service}-${this.serverless.service.provider.stage}-${name}`,
      memorySize: fn.memorySize,
      timeout: fn.timeout,
      runtime: fn.runtime,
      environment: fn.environment,
      events: fn.events,
    }
  }

  /**
   * Get all functions defined in serverless.yml.
   */
  getAllFunctions(): Record<string, FunctionMetadata> {
    const result: Record<string, FunctionMetadata> = {}
    for (const name of Object.keys(this.serverless.service.functions)) {
      result[name] = this.getFunction(name)
    }
    return result
  }

  private setupTestEnvironment(): void {
    const { autoLoadEnv, envFile } = this.config

    if (autoLoadEnv !== false) {
      const file = envFile ?? '.env.test'
      loadEnvFile(file, this.serverless.config.servicePath)
    }

    const config: TestingConfig = {
      service: this.serverless.service.service,
      stage: this.serverless.service.provider.stage,
      region: this.serverless.service.provider.region,
      functions: this.getAllFunctions(),
    }

    const outputPath = generateConfig(config, this.serverless.config.servicePath)
    console.log(`[serverless-testing-plugin] Config written to ${outputPath}`)
  }

  private runTests(): void {
    console.log('[serverless-testing-plugin] Tests should be run via your test runner (e.g., npm test)')
  }
}
