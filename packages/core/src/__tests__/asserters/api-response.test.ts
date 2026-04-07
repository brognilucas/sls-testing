import { assertApiResponse } from '../../asserters/api-response'

describe('assertApiResponse', () => {
  it('passes when status code matches', () => {
    expect(() =>
      assertApiResponse(
        { statusCode: 200, body: '{"id":"1"}' },
        { statusCode: 200, bodyContains: { id: '1' } },
      ),
    ).not.toThrow()
  })

  it('checks headers case-insensitively', () => {
    expect(() =>
      assertApiResponse(
        { statusCode: 200, headers: { 'Content-Type': 'application/json' } },
        { headers: { 'content-type': 'application/json' } },
      ),
    ).not.toThrow()
  })

  it('throws on status code mismatch', () => {
    expect(() =>
      assertApiResponse({ statusCode: 404 }, { statusCode: 200 }),
    ).toThrow('Expected status code 200, received 404')
  })

  it('throws on body partial match failure', () => {
    expect(() =>
      assertApiResponse(
        { statusCode: 200, body: '{"name":"Lucas"}' },
        { bodyContains: { name: 'Other' } },
      ),
    ).toThrow('Body mismatch')
  })

  it('throws when body is not valid JSON and bodyContains is object', () => {
    expect(() =>
      assertApiResponse(
        { statusCode: 200, body: 'not json' },
        { bodyContains: { id: '1' } },
      ),
    ).toThrow('Response body is not valid JSON')
  })

  it('matches bodyContains as string substring', () => {
    expect(() =>
      assertApiResponse(
        { statusCode: 200, body: 'Hello World' },
        { bodyContains: 'World' },
      ),
    ).not.toThrow()
  })

  it('throws when body is missing but bodyContains is specified', () => {
    expect(() =>
      assertApiResponse(
        { statusCode: 204 },
        { bodyContains: { id: '1' } },
      ),
    ).toThrow('response has no body')
  })

  it('throws when string bodyContains does not match', () => {
    expect(() =>
      assertApiResponse(
        { statusCode: 200, body: 'Hello World' },
        { bodyContains: 'NotFound' },
      ),
    ).toThrow('Expected body to contain "NotFound"')
  })

  it('throws when header value does not match', () => {
    expect(() =>
      assertApiResponse(
        { statusCode: 200, headers: { 'Content-Type': 'text/plain' } },
        { headers: { 'Content-Type': 'application/json' } },
      ),
    ).toThrow('Expected header "Content-Type" to be "application/json"')
  })

  it('passes with partial body match (subset of keys)', () => {
    expect(() =>
      assertApiResponse(
        { statusCode: 200, body: '{"id":"1","name":"Lucas","age":30}' },
        { bodyContains: { id: '1' } },
      ),
    ).not.toThrow()
  })
})
