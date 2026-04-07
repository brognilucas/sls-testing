import { buildApiGatewayV2Event, buildApiGatewayEvent } from '../../builders/api-gateway-v2'

describe('buildApiGatewayV2Event', () => {
  it('returns version 2.0 with no arguments', () => {
    const event = buildApiGatewayV2Event()

    expect(event.version).toBe('2.0')
    expect(event.routeKey).toBe('$default')
    expect(event.rawPath).toBe('/')
    expect(event.rawQueryString).toBe('')
    expect(event.headers).toBeDefined()
    expect(event.isBase64Encoded).toBe(false)
    expect(event.requestContext).toBeDefined()
    expect(event.requestContext.http.method).toBe('GET')
    expect(event.requestContext.http.path).toBe('/')
    expect(event.requestContext.stage).toBe('$default')
    expect(event.requestContext.requestId).toBeDefined()
  })

  it('omits optional fields (body, pathParameters, queryStringParameters, cookies) from defaults', () => {
    const event = buildApiGatewayV2Event()

    // These should not exist on the default event (not null, just absent)
    expect('body' in event).toBe(false)
    expect('pathParameters' in event).toBe(false)
    expect('queryStringParameters' in event).toBe(false)
    expect('cookies' in event).toBe(false)
  })

  it('maps shorthand method to requestContext.http.method', () => {
    const event = buildApiGatewayV2Event({ method: 'POST' })

    expect(event.requestContext.http.method).toBe('POST')
  })

  it('maps shorthand path to rawPath and requestContext.http.path', () => {
    const event = buildApiGatewayV2Event({ path: '/users/123' })

    expect(event.rawPath).toBe('/users/123')
    expect(event.requestContext.http.path).toBe('/users/123')
  })

  it('maps shorthand body and auto-serializes objects', () => {
    const body = { message: 'hello' }
    const event = buildApiGatewayV2Event({ body: body as unknown as string })

    expect(event.body).toBe(JSON.stringify(body))
  })

  it('auto-derives rawQueryString from queryStringParameters', () => {
    const event = buildApiGatewayV2Event({
      queryStringParameters: { foo: 'bar', baz: '123' },
    })

    expect(event.queryStringParameters).toEqual({ foo: 'bar', baz: '123' })
    // rawQueryString should be derived
    const qs = event.rawQueryString
    expect(qs).toContain('foo=bar')
    expect(qs).toContain('baz=123')
  })

  it('rawQueryString takes precedence when both rawQueryString and queryStringParameters provided', () => {
    const event = buildApiGatewayV2Event({
      rawQueryString: 'custom=override',
      queryStringParameters: { foo: 'bar' },
    })

    expect(event.rawQueryString).toBe('custom=override')
    expect(event.queryStringParameters).toEqual({ foo: 'bar' })
  })

  it('keeps body as string when given a string', () => {
    const event = buildApiGatewayV2Event({ body: 'plain-text' })

    expect(event.body).toBe('plain-text')
  })

  it('combines multiple shorthands', () => {
    const event = buildApiGatewayV2Event({
      method: 'PUT',
      path: '/items/42',
      body: { name: 'updated' } as unknown as string,
    })

    expect(event.requestContext.http.method).toBe('PUT')
    expect(event.rawPath).toBe('/items/42')
    expect(event.requestContext.http.path).toBe('/items/42')
    expect(event.body).toBe(JSON.stringify({ name: 'updated' }))
  })

  it('exports buildApiGatewayEvent as an alias', () => {
    expect(buildApiGatewayEvent).toBe(buildApiGatewayV2Event)
  })
})
