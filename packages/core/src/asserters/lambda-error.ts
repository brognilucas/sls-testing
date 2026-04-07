export interface LambdaErrorExpectations {
  errorType?: string
  messagePattern?: string | RegExp
  statusCode?: number
}

/**
 * Asserts that a Lambda error matches expectations.
 * - errorType: exact match on error name/type
 * - messagePattern: string includes or RegExp match on error message
 * - statusCode: exact match on statusCode property (for structured errors)
 */
export function assertLambdaError(
  error: unknown,
  expectations: LambdaErrorExpectations,
): void {
  if (!(error instanceof Error) && typeof error !== 'object') {
    throw new Error(
      `Expected an Error or object, received ${typeof error}`,
    )
  }

  const err = error as Record<string, unknown>
  const errorName = error instanceof Error ? error.name : (err.errorType as string | undefined)
  const errorMessage = error instanceof Error ? error.message : (err.errorMessage as string | undefined) ?? ''

  if (expectations.errorType !== undefined) {
    if (errorName !== expectations.errorType) {
      throw new Error(
        `Expected error type "${expectations.errorType}", received "${errorName}"`,
      )
    }
  }

  if (expectations.messagePattern !== undefined) {
    const pattern = expectations.messagePattern
    if (typeof pattern === 'string') {
      if (!errorMessage.includes(pattern)) {
        throw new Error(
          `Expected error message to contain "${pattern}", received "${errorMessage}"`,
        )
      }
    } else {
      if (!pattern.test(errorMessage)) {
        throw new Error(
          `Expected error message to match ${pattern}, received "${errorMessage}"`,
        )
      }
    }
  }

  if (expectations.statusCode !== undefined) {
    const actualStatus = err.statusCode as number | undefined
    if (actualStatus !== expectations.statusCode) {
      throw new Error(
        `Expected error statusCode ${expectations.statusCode}, received ${actualStatus}`,
      )
    }
  }
}
