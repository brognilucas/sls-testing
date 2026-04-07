import { buildApiGatewayV1Event, buildLambdaContext } from '@sls-testing/core'
import { ServerlessTestingPlugin } from 'serverless-testing-plugin'
import { handler } from './process-order'

// Register Jest matchers
import '@sls-testing/jest'

// ------------------------------------------------------------------
// Demonstrate the plugin: load function metadata from serverless.yml
// and use it to configure test context and environment variables.
// ------------------------------------------------------------------

// Create a mock Serverless instance matching the project's serverless.yml
const serverless = {
  service: {
    service: 'order-service',
    functions: {
      processOrder: {
        handler: 'src/handlers/process-order.handler',
        memorySize: 512,
        timeout: 30,
        runtime: 'nodejs20.x',
        environment: {
          ORDERS_TABLE: 'orders-test',
          NOTIFICATION_TOPIC: 'arn:aws:sns:us-east-1:123456789012:order-notifications-test',
        },
        events: [{ http: { path: '/orders', method: 'post' } }],
      },
      getOrder: {
        handler: 'src/handlers/get-order.handler',
        memorySize: 256,
        timeout: 10,
        environment: { ORDERS_TABLE: 'orders-test' },
        events: [{ http: { path: '/orders/{id}', method: 'get' } }],
      },
    },
    provider: { stage: 'test', region: 'us-east-1' },
  },
  config: { servicePath: __dirname + '/../..' },
} as any

const plugin = new ServerlessTestingPlugin(serverless, {})

describe('processOrder handler (with plugin metadata)', () => {
  // Use the plugin to get function config and set env vars
  const fnConfig = plugin.getFunction('processOrder')

  beforeAll(() => {
    // Load environment from function config — same vars as serverless.yml
    if (fnConfig.environment) {
      for (const [key, value] of Object.entries(fnConfig.environment)) {
        process.env[key] = value
      }
    }
  })

  afterAll(() => {
    delete process.env.ORDERS_TABLE
    delete process.env.NOTIFICATION_TOPIC
  })

  it('has the expected function configuration', () => {
    expect(fnConfig.handler).toBe('src/handlers/process-order.handler')
    expect(fnConfig.memorySize).toBe(512)
    expect(fnConfig.timeout).toBe(30)
  })

  it('creates an order using env from serverless.yml', async () => {
    // Build a context that matches the function's actual config
    const context = buildLambdaContext({
      functionName: fnConfig.name,
      memoryLimitInMB: String(fnConfig.memorySize),
      remainingTimeOverride: (fnConfig.timeout ?? 30) * 1000,
    })

    const event = buildApiGatewayV1Event({
      httpMethod: 'POST',
      path: '/orders',
      body: JSON.stringify({ product: 'Widget', amount: 29.99 }),
    })

    const result = await handler(event)

    expect(result).toHaveStatusCode(201)
    expect(result).toBeSuccessfulApiResponse()

    // Verify the handler used the env var from serverless.yml
    const body = JSON.parse(result.body)
    expect(body.table).toBe('orders-test')
    expect(body.product).toBe('Widget')
    expect(body.status).toBe('pending')
    expect(body.orderId).toMatch(/^ord_/)
  })

  it('returns 400 when body is missing', async () => {
    const event = buildApiGatewayV1Event({
      httpMethod: 'POST',
      path: '/orders',
    })

    const result = await handler(event)

    expect(result).toBeClientError()
  })
})

describe('plugin metadata for all functions', () => {
  it('lists all functions from serverless.yml', () => {
    const all = plugin.getAllFunctions()

    expect(Object.keys(all)).toEqual(['processOrder', 'getOrder'])
    expect(all.processOrder.memorySize).toBe(512)
    expect(all.getOrder.memorySize).toBe(256)
  })

  it('throws for unknown function names', () => {
    expect(() => plugin.getFunction('doesNotExist')).toThrow(
      /Function "doesNotExist" not found/,
    )
  })
})
