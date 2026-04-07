import type { ApiResponse } from '@sls-testing/core'

interface LambdaResponseExpectation {
  statusCode?: number
  body?: string | Record<string, unknown>
  headers?: Record<string, string | undefined>
  [key: string]: unknown
}

export function toMatchLambdaResponse(
  this: jest.MatcherContext,
  received: ApiResponse,
  expected: LambdaResponseExpectation,
) {
  const mismatches: string[] = []

  // Check statusCode if present in expected
  if (expected.statusCode !== undefined) {
    if (received.statusCode !== expected.statusCode) {
      mismatches.push(
        `statusCode: expected ${expected.statusCode}, received ${received.statusCode}`,
      )
    }
  }

  // Check body if present in expected
  if (expected.body !== undefined) {
    if (received.body === undefined || received.body === null) {
      mismatches.push(
        `body: expected to exist, but response has no body`,
      )
    } else {
      let parsedReceived: unknown

      try {
        parsedReceived = JSON.parse(received.body)
      } catch {
        mismatches.push(
          `body: received body is not valid JSON: "${received.body}"`,
        )
        parsedReceived = undefined
      }

      if (parsedReceived !== undefined) {
        // If expected.body is a string, parse it as JSON
        // If it's an object (possibly containing asymmetric matchers), use it directly
        let expectedBody: unknown

        if (typeof expected.body === 'string') {
          try {
            expectedBody = JSON.parse(expected.body)
          } catch {
            // If expected body is not valid JSON, compare as strings
            if (received.body !== expected.body) {
              mismatches.push(
                `body: expected "${expected.body}", received "${received.body}"`,
              )
            }
            expectedBody = undefined
          }
        } else {
          // expected.body is an object (may contain asymmetric matchers)
          expectedBody = expected.body
        }

        if (expectedBody !== undefined) {
          if (!this.equals(parsedReceived, expect.objectContaining(expectedBody as Record<string, unknown>))) {
            mismatches.push(
              `body: expected ${JSON.stringify(expectedBody)} to match received ${JSON.stringify(parsedReceived)}`,
            )
          }
        }
      }
    }
  }

  // Check headers case-insensitively
  if (expected.headers !== undefined) {
    const receivedHeaders = normalizeHeaders(received.headers ?? {})
    for (const [key, expectedValue] of Object.entries(expected.headers)) {
      const normalizedKey = key.toLowerCase()
      const actualValue = receivedHeaders[normalizedKey]
      if (actualValue !== expectedValue) {
        mismatches.push(
          `header "${key}": expected "${expectedValue}", received "${actualValue ?? 'undefined'}"`,
        )
      }
    }
  }

  const pass = mismatches.length === 0

  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to match, but it does`
        : `Lambda response mismatch:\n${mismatches.map((m) => `  - ${m}`).join('\n')}`,
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
