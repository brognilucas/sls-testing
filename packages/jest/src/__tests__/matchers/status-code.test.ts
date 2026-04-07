import { matchers } from '../../matchers'

expect.extend(matchers)

describe('toHaveStatusCode', () => {
  it('passes when status code matches', () => {
    expect({ statusCode: 200 }).toHaveStatusCode(200)
  })

  it('fails when status code does not match', () => {
    expect(() => {
      expect({ statusCode: 404 }).toHaveStatusCode(200)
    }).toThrow('Expected status code 200, received 404')
  })

  it('.not passes when status code does not match', () => {
    expect({ statusCode: 404 }).not.toHaveStatusCode(200)
  })

  it('.not fails when status code matches', () => {
    expect(() => {
      expect({ statusCode: 200 }).not.toHaveStatusCode(200)
    }).toThrow('Expected response not to have status code 200, but it does')
  })
})

describe('toBeSuccessfulApiResponse', () => {
  it('passes for 200', () => {
    expect({ statusCode: 200 }).toBeSuccessfulApiResponse()
  })

  it('passes for 204', () => {
    expect({ statusCode: 204 }).toBeSuccessfulApiResponse()
  })

  it('fails for 500', () => {
    expect(() => {
      expect({ statusCode: 500 }).toBeSuccessfulApiResponse()
    }).toThrow('Expected response to be successful (2xx), received 500')
  })

  it('.not fails on 200', () => {
    expect(() => {
      expect({ statusCode: 200 }).not.toBeSuccessfulApiResponse()
    }).toThrow('Expected response not to be successful (2xx), but received 200')
  })

  // Boundary tests
  it('199 is not 2xx', () => {
    expect({ statusCode: 199 }).not.toBeSuccessfulApiResponse()
  })

  it('200 is 2xx', () => {
    expect({ statusCode: 200 }).toBeSuccessfulApiResponse()
  })

  it('299 is 2xx', () => {
    expect({ statusCode: 299 }).toBeSuccessfulApiResponse()
  })

  it('300 is not 2xx', () => {
    expect({ statusCode: 300 }).not.toBeSuccessfulApiResponse()
  })
})

describe('toBeClientError', () => {
  it('passes for 400', () => {
    expect({ statusCode: 400 }).toBeClientError()
  })

  it('passes for 422', () => {
    expect({ statusCode: 422 }).toBeClientError()
  })

  it('fails for 200', () => {
    expect(() => {
      expect({ statusCode: 200 }).toBeClientError()
    }).toThrow('Expected response to be a client error (4xx), received 200')
  })

  it('.not fails on 400', () => {
    expect(() => {
      expect({ statusCode: 400 }).not.toBeClientError()
    }).toThrow('Expected response not to be a client error (4xx), but received 400')
  })
})

describe('toBeServerError', () => {
  it('passes for 500', () => {
    expect({ statusCode: 500 }).toBeServerError()
  })

  it('passes for 502', () => {
    expect({ statusCode: 502 }).toBeServerError()
  })

  it('fails for 200', () => {
    expect(() => {
      expect({ statusCode: 200 }).toBeServerError()
    }).toThrow('Expected response to be a server error (5xx), received 200')
  })

  it('.not fails on 500', () => {
    expect(() => {
      expect({ statusCode: 500 }).not.toBeServerError()
    }).toThrow('Expected response not to be a server error (5xx), but received 500')
  })
})
