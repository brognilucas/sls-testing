import { assertSQSBatchResponse } from '../../asserters/sqs-batch'

describe('assertSQSBatchResponse', () => {
  it('passes when failed message IDs match', () => {
    expect(() =>
      assertSQSBatchResponse(
        { batchItemFailures: [{ itemIdentifier: 'msg-2' }] },
        { failedMessageIds: ['msg-2'] },
      ),
    ).not.toThrow()
  })

  it('passes when no failures and empty expected', () => {
    expect(() =>
      assertSQSBatchResponse(
        { batchItemFailures: [] },
        { failedMessageIds: [] },
      ),
    ).not.toThrow()
  })

  it('throws when expected failed ID not in response', () => {
    expect(() =>
      assertSQSBatchResponse(
        { batchItemFailures: [{ itemIdentifier: 'msg-1' }] },
        { failedMessageIds: ['msg-3'] },
      ),
    ).toThrow('Expected failed message IDs')
  })

  it('treats undefined batchItemFailures as empty array', () => {
    expect(() =>
      assertSQSBatchResponse({}, { failedMessageIds: [] }),
    ).not.toThrow()
  })

  it('fails when batchItemFailures is undefined but failures expected', () => {
    expect(() =>
      assertSQSBatchResponse({}, { failedMessageIds: ['msg-1'] }),
    ).toThrow('Expected failed message IDs')
  })
})
