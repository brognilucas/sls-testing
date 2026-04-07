import { buildApiGatewayV1Event } from '@sls-testing/core'
import { ServerlessTestingPlugin } from 'serverless-testing-plugin'
import { handler } from './get-order'

import '@sls-testing/jest'

// Reuse the same mock serverless instance
const serverless = {
  service: {
    service: 'order-service',
    functions: {
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

describe('getOrder handler (with plugin metadata)', () => {
  const fnConfig = plugin.getFunction('getOrder')

  beforeAll(() => {
    if (fnConfig.environment) {
      for (const [key, value] of Object.entries(fnConfig.environment)) {
        process.env[key] = value
      }
    }
  })

  afterAll(() => {
    delete process.env.ORDERS_TABLE
  })

  it('returns an order by ID', async () => {
    const event = buildApiGatewayV1Event({
      httpMethod: 'GET',
      path: '/orders/ord_123',
      pathParameters: { id: 'ord_123' },
    })

    const result = await handler(event)

    expect(result).toHaveStatusCode(200)
    expect(result).toMatchLambdaResponse({
      body: {
        orderId: 'ord_123',
        table: 'orders-test',
      },
    })
  })

  it('returns 400 when order ID is missing', async () => {
    const event = buildApiGatewayV1Event({
      httpMethod: 'GET',
      path: '/orders/',
    })

    const result = await handler(event)

    expect(result).toBeClientError()
  })
})
