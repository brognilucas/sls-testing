import { matchers } from '../../matchers'

expect.extend(matchers)

describe('toMatchLambdaResponse', () => {
  it('matches partial body', () => {
    const response = {
      statusCode: 200,
      body: JSON.stringify({ id: '123', name: 'test', extra: true }),
    }

    expect(response).toMatchLambdaResponse({
      body: JSON.stringify({ name: 'test' }),
    })
  })

  it('matches statusCode when provided in expected', () => {
    const response = {
      statusCode: 201,
      body: JSON.stringify({ id: '1' }),
    }

    expect(response).toMatchLambdaResponse({
      statusCode: 201,
      body: JSON.stringify({ id: '1' }),
    })
  })

  it('fails when statusCode does not match', () => {
    const response = {
      statusCode: 200,
      body: JSON.stringify({ id: '1' }),
    }

    expect(() => {
      expect(response).toMatchLambdaResponse({
        statusCode: 404,
      })
    }).toThrow('statusCode: expected 404, received 200')
  })

  it('fails when body does not match', () => {
    const response = {
      statusCode: 200,
      body: JSON.stringify({ id: '1', name: 'foo' }),
    }

    expect(() => {
      expect(response).toMatchLambdaResponse({
        body: JSON.stringify({ name: 'bar' }),
      })
    }).toThrow('body:')
  })

  it('fails when response has no body but expected does', () => {
    const response = {
      statusCode: 200,
    }

    expect(() => {
      expect(response).toMatchLambdaResponse({
        body: JSON.stringify({ foo: 'bar' }),
      })
    }).toThrow('body: expected to exist, but response has no body')
  })

  it('.not fails when response matches', () => {
    const response = {
      statusCode: 200,
      body: JSON.stringify({ id: '123' }),
    }

    expect(() => {
      expect(response).not.toMatchLambdaResponse({
        statusCode: 200,
        body: JSON.stringify({ id: '123' }),
      })
    }).toThrow('Expected response not to match, but it does')
  })

  it('matches headers case-insensitively', () => {
    const response = {
      statusCode: 200,
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    }

    expect(response).toMatchLambdaResponse({
      headers: { 'content-type': 'application/json' },
    })
  })

  it('uses this.equals for asymmetric matcher support with object body', () => {
    const response = {
      statusCode: 200,
      body: JSON.stringify({ id: '123', timestamp: Date.now() }),
    }

    // Pass body as an object (not JSON.stringify) to preserve asymmetric matchers
    expect(response).toMatchLambdaResponse({
      body: { id: expect.any(String) },
    })
  })

  it('uses this.equals for asymmetric matcher support with stringified body', () => {
    const response = {
      statusCode: 200,
      body: JSON.stringify({ id: '123', name: 'test' }),
    }

    // Pass body as JSON string for exact partial match
    expect(response).toMatchLambdaResponse({
      body: JSON.stringify({ id: '123' }),
    })
  })
})
