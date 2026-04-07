import { deepPartialMatch } from '../utils/deep-partial-match.js'

export interface ApiResponseExpectations {
  statusCode?: number
  bodyContains?: Record<string, unknown> | string
  headers?: Record<string, string>
}

export interface ApiResponse {
  statusCode: number
  body?: string
  headers?: Record<string, string | undefined>
  [key: string]: unknown
}

/**
 * Asserts that an API Gateway response matches expectations.
 * - statusCode: exact match
 * - bodyContains: deep partial match (parses JSON body) or string match
 * - headers: subset match with case-insensitive keys
 */
export function assertApiResponse(
  response: ApiResponse,
  expectations: ApiResponseExpectations,
): void {
  if (expectations.statusCode !== undefined) {
    if (response.statusCode !== expectations.statusCode) {
      throw new Error(
        `Expected status code ${expectations.statusCode}, received ${response.statusCode}`,
      )
    }
  }

  if (expectations.bodyContains !== undefined) {
    if (response.body === undefined || response.body === null) {
      throw new Error(
        `Expected body to contain ${JSON.stringify(expectations.bodyContains)}, but response has no body`,
      )
    }

    if (typeof expectations.bodyContains === 'string') {
      if (!response.body.includes(expectations.bodyContains)) {
        throw new Error(
          `Expected body to contain "${expectations.bodyContains}", received "${response.body}"`,
        )
      }
    } else {
      let parsedBody: unknown
      try {
        parsedBody = JSON.parse(response.body)
      } catch {
        throw new Error(
          `Response body is not valid JSON: "${response.body}"`,
        )
      }

      const result = deepPartialMatch(parsedBody, expectations.bodyContains)
      if (!result.pass) {
        throw new Error(
          `Body mismatch: ${result.diff}\nExpected: ${JSON.stringify(expectations.bodyContains)}\nReceived: ${JSON.stringify(parsedBody)}`,
        )
      }
    }
  }

  if (expectations.headers !== undefined) {
    const responseHeaders = normalizeHeaders(response.headers ?? {})
    for (const [key, expectedValue] of Object.entries(expectations.headers)) {
      const normalizedKey = key.toLowerCase()
      const actualValue = responseHeaders[normalizedKey]
      if (actualValue !== expectedValue) {
        throw new Error(
          `Expected header "${key}" to be "${expectedValue}", received "${actualValue ?? 'undefined'}"`,
        )
      }
    }
  }
}

function normalizeHeaders(
  headers: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const normalized: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value
  }
  return normalized
}
