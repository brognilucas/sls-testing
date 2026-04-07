import type { ApiResponse } from '@sls-testing/core'

export function toHaveStatusCode(
  this: jest.MatcherContext,
  received: ApiResponse,
  expected: number,
) {
  const pass = received.statusCode === expected

  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to have status code ${expected}, but it does`
        : `Expected status code ${expected}, received ${received.statusCode}`,
  }
}

export function toBeSuccessfulApiResponse(
  this: jest.MatcherContext,
  received: ApiResponse,
) {
  const pass = received.statusCode >= 200 && received.statusCode <= 299

  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to be successful (2xx), but received ${received.statusCode}`
        : `Expected response to be successful (2xx), received ${received.statusCode}`,
  }
}

export function toBeClientError(
  this: jest.MatcherContext,
  received: ApiResponse,
) {
  const pass = received.statusCode >= 400 && received.statusCode <= 499

  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to be a client error (4xx), but received ${received.statusCode}`
        : `Expected response to be a client error (4xx), received ${received.statusCode}`,
  }
}

export function toBeServerError(
  this: jest.MatcherContext,
  received: ApiResponse,
) {
  const pass = received.statusCode >= 500 && received.statusCode <= 599

  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to be a server error (5xx), but received ${received.statusCode}`
        : `Expected response to be a server error (5xx), received ${received.statusCode}`,
  }
}
