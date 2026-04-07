import { buildApiGatewayV1Event } from '../../builders/api-gateway-v1'

describe('buildApiGatewayV1Event', () => {
  it('returns a complete event with no arguments', () => {
    const event = buildApiGatewayV1Event()

    expect(event.httpMethod).toBe('GET')
    expect(event.path).toBe('/')
    expect(event.body).toBeNull()
    expect(event.isBase64Encoded).toBe(false)
    expect(event.resource).toBe('/{proxy+}')
    expect(event.headers).toBeDefined()
    expect(event.multiValueHeaders).toBeDefined()
    expect(event.pathParameters).toBeNull()
    expect(event.queryStringParameters).toBeNull()
    expect(event.multiValueQueryStringParameters).toBeNull()
    expect(event.stageVariables).toBeNull()
    expect(event.requestContext).toBeDefined()
    expect(event.requestContext.accountId).toBeDefined()
    expect(event.requestContext.apiId).toBeDefined()
    expect(event.requestContext.httpMethod).toBe('GET')
    expect(event.requestContext.identity).toBeDefined()
    expect(event.requestContext.identity.cognitoAuthenticationProvider).toBeNull()
    expect(event.requestContext.identity.cognitoAuthenticationType).toBeNull()
    expect(event.requestContext.identity.cognitoIdentityId).toBeNull()
    expect(event.requestContext.identity.cognitoIdentityPoolId).toBeNull()
    expect(event.requestContext.identity.sourceIp).toBe('127.0.0.1')
    expect(event.requestContext.requestId).toBeDefined()
    expect(event.requestContext.stage).toBe('test')
  })

  it('auto-serializes body when given an object', () => {
    const body = { foo: 'bar', count: 42 }
    const event = buildApiGatewayV1Event({ body: body as unknown as string })

    expect(event.body).toBe(JSON.stringify(body))
  })

  it('keeps body as string when given a string', () => {
    const event = buildApiGatewayV1Event({ body: 'raw-string-body' })

    expect(event.body).toBe('raw-string-body')
  })

  it('does not double-stringify a JSON string body', () => {
    const jsonString = JSON.stringify({ foo: 'bar' })
    const event = buildApiGatewayV1Event({ body: jsonString })

    expect(event.body).toBe(jsonString)
  })

  it('keeps body as null when explicitly set to null', () => {
    const event = buildApiGatewayV1Event({ body: null })

    expect(event.body).toBeNull()
  })

  it('overrides pathParameters', () => {
    const event = buildApiGatewayV1Event({
      pathParameters: { id: '123', slug: 'test' },
    })

    expect(event.pathParameters).toEqual({ id: '123', slug: 'test' })
  })

  it('deep merges nested requestContext', () => {
    const event = buildApiGatewayV1Event({
      requestContext: {
        stage: 'production',
        identity: {
          sourceIp: '10.0.0.1',
        },
      },
    })

    expect(event.requestContext.stage).toBe('production')
    expect(event.requestContext.identity.sourceIp).toBe('10.0.0.1')
    // Other identity fields preserved
    expect(event.requestContext.identity.cognitoIdentityId).toBeNull()
    expect(event.requestContext.accountId).toBeDefined()
    expect(event.requestContext.requestId).toBeDefined()
  })

  it('overrides httpMethod and path', () => {
    const event = buildApiGatewayV1Event({
      httpMethod: 'POST',
      path: '/users',
    })

    expect(event.httpMethod).toBe('POST')
    expect(event.path).toBe('/users')
  })
})
