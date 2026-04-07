import type { SQSBatchResponse } from '@sls-testing/core'

export function toHaveNoFailedMessages(
  this: jest.MatcherContext,
  received: SQSBatchResponse,
) {
  const failures = received.batchItemFailures ?? []
  const pass = failures.length === 0

  return {
    pass,
    message: () =>
      pass
        ? `Expected response to have failed messages, but none were found`
        : `Expected no failed messages, but found ${failures.length}: [${failures.map((f) => f.itemIdentifier).join(', ')}]`,
  }
}

export function toHaveFailedMessage(
  this: jest.MatcherContext,
  received: SQSBatchResponse,
  messageId: string,
) {
  const failures = received.batchItemFailures ?? []
  const pass = failures.some((f) => f.itemIdentifier === messageId)

  return {
    pass,
    message: () =>
      pass
        ? `Expected message "${messageId}" not to be in failures, but it was found`
        : `Expected message "${messageId}" to be in failures, but found: [${failures.map((f) => f.itemIdentifier).join(', ') || 'none'}]`,
  }
}
