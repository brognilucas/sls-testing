export interface SQSBatchExpectations {
  failedMessageIds?: string[]
}

export interface SQSBatchResponse {
  batchItemFailures?: Array<{ itemIdentifier: string }>
}

/**
 * Asserts that an SQS batch response matches expectations.
 * - failedMessageIds: exact set match against batchItemFailures
 */
export function assertSQSBatchResponse(
  response: SQSBatchResponse,
  expectations: SQSBatchExpectations,
): void {
  const failures = response.batchItemFailures ?? []

  if (expectations.failedMessageIds !== undefined) {
    const actualIds = failures.map((f) => f.itemIdentifier).sort()
    const expectedIds = [...expectations.failedMessageIds].sort()

    if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
      throw new Error(
        `Expected failed message IDs: [${expectedIds.join(', ')}], received: [${actualIds.join(', ')}]`,
      )
    }
  }
}
