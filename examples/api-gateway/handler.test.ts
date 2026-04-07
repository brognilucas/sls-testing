import { buildApiGatewayV2Event } from '@sls-testing/core'
import { handler } from './handler'

// Register Jest matchers
import '@sls-testing/jest'

describe('API Gateway Handler', () => {
  it('returns 200 for GET requests', async () => {
    const event = buildApiGatewayV2Event({
      requestContext: { http: { method: 'GET' } },
      rawPath: '/users',
    })

    const result = await handler(event)

    expect(result).toHaveStatusCode(200)
    expect(result).toBeSuccessfulApiResponse()
  })

  it('creates a user on POST with body', async () => {
    const event = buildApiGatewayV2Event({
      requestContext: { http: { method: 'POST' } },
      rawPath: '/users',
      body: JSON.stringify({ name: 'Lucas' }),
    })

    const result = await handler(event)

    expect(result).toHaveStatusCode(201)
    expect(result).toMatchLambdaResponse({
      body: { userId: 'usr_123', name: 'Lucas' },
    })
  })

  it('returns 400 for POST without body', async () => {
    const event = buildApiGatewayV2Event({
      requestContext: { http: { method: 'POST' } },
      rawPath: '/users',
    })

    const result = await handler(event)

    expect(result).toBeClientError()
  })

  it('returns 405 for unsupported methods', async () => {
    const event = buildApiGatewayV2Event({
      requestContext: { http: { method: 'DELETE' } },
    })

    const result = await handler(event)

    expect(result).toBeClientError()
  })
})
