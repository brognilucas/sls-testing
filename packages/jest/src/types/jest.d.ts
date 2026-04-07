import type { ApiResponse, SQSBatchResponse } from '@sls-testing/core'

interface CustomMatchers<R = unknown> {
  /** Assert exact status code match */
  toHaveStatusCode(expected: number): R
  /** Assert response has 2xx status code */
  toBeSuccessfulApiResponse(): R
  /** Assert response has 4xx status code */
  toBeClientError(): R
  /** Assert response has 5xx status code */
  toBeServerError(): R
  /** Assert response matches expected Lambda response (statusCode, body via deep partial, headers case-insensitive). Body can be a JSON string or an object (supports asymmetric matchers like expect.any()). */
  toMatchLambdaResponse(expected: { statusCode?: number; body?: string | Record<string, unknown>; headers?: Record<string, string | undefined>; [key: string]: unknown }): R
  /** Assert SQS batch response has no failed messages */
  toHaveNoFailedMessages(): R
  /** Assert SQS batch response contains a specific failed message ID */
  toHaveFailedMessage(messageId: string): R
  /** Assert a Jest mock/spy was never called (no side effects) */
  toHaveNoSideEffects(): R
}

declare global {
  namespace jest {
    interface Matchers<R> extends CustomMatchers<R> {}
    interface Expect extends CustomMatchers {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

export {}
