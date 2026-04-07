import { ServerlessTestingPlugin } from '../plugin'

function createMockServerless(overrides: Record<string, unknown> = {}) {
  return {
    service: {
      service: 'my-service',
      functions: {
        processOrder: {
          handler: 'src/handlers/order.handler',
          memorySize: 512,
          timeout: 30,
          runtime: 'nodejs20.x',
          environment: { TABLE_NAME: 'orders' },
          events: [{ http: { path: '/orders', method: 'post' } }],
        },
        sendEmail: {
          handler: 'src/handlers/email.handler',
          timeout: 60,
        },
      },
      provider: {
        stage: 'dev',
        region: 'us-east-1',
      },
      custom: {
        serverlessTesting: {
          autoLoadEnv: true,
          envFile: '.env.test',
        },
      },
      ...overrides,
    },
    config: {
      servicePath: '/tmp/test-project',
    },
  }
}

describe('ServerlessTestingPlugin', () => {
  it('instantiates with serverless config', () => {
    const serverless = createMockServerless()
    const plugin = new ServerlessTestingPlugin(serverless as any, {})
    expect(plugin).toBeDefined()
    expect(plugin.hooks).toBeDefined()
    expect(plugin.commands).toBeDefined()
  })

  it('registers test command with lifecycle events', () => {
    const serverless = createMockServerless()
    const plugin = new ServerlessTestingPlugin(serverless as any, {})
    expect(plugin.commands).toHaveProperty('test')
    expect(plugin.hooks).toHaveProperty('test:setup')
    expect(plugin.hooks).toHaveProperty('test:run')
  })

  describe('getFunction', () => {
    it('returns correct metadata for an existing function', () => {
      const serverless = createMockServerless()
      const plugin = new ServerlessTestingPlugin(serverless as any, {})
      const fn = plugin.getFunction('processOrder')

      expect(fn).toEqual({
        handler: 'src/handlers/order.handler',
        name: 'my-service-dev-processOrder',
        memorySize: 512,
        timeout: 30,
        runtime: 'nodejs20.x',
        environment: { TABLE_NAME: 'orders' },
        events: [{ http: { path: '/orders', method: 'post' } }],
      })
    })

    it('throws descriptive error for nonexistent function', () => {
      const serverless = createMockServerless()
      const plugin = new ServerlessTestingPlugin(serverless as any, {})

      expect(() => plugin.getFunction('nonexistent')).toThrow(
        /Function "nonexistent" not found/,
      )
      expect(() => plugin.getFunction('nonexistent')).toThrow(
        /processOrder/,
      )
    })

    it('returns metadata for function without optional fields', () => {
      const serverless = createMockServerless()
      const plugin = new ServerlessTestingPlugin(serverless as any, {})
      const fn = plugin.getFunction('sendEmail')

      expect(fn.handler).toBe('src/handlers/email.handler')
      expect(fn.timeout).toBe(60)
      expect(fn.memorySize).toBeUndefined()
      expect(fn.runtime).toBeUndefined()
    })
  })

  describe('getAllFunctions', () => {
    it('returns all functions with metadata', () => {
      const serverless = createMockServerless()
      const plugin = new ServerlessTestingPlugin(serverless as any, {})
      const all = plugin.getAllFunctions()

      expect(Object.keys(all)).toEqual(['processOrder', 'sendEmail'])
      expect(all.processOrder.handler).toBe('src/handlers/order.handler')
      expect(all.sendEmail.handler).toBe('src/handlers/email.handler')
    })
  })

  it('handles missing custom.serverlessTesting gracefully', () => {
    const serverless = createMockServerless({ custom: undefined })
    expect(() => new ServerlessTestingPlugin(serverless as any, {})).not.toThrow()
  })
})
