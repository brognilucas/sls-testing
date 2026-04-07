import { buildSQSEvent } from '../../builders/sqs'

describe('buildSQSEvent', () => {
  it('returns a default event with one record when called with no args', () => {
    const event = buildSQSEvent()

    expect(event.Records).toHaveLength(1)
    const record = event.Records[0]
    expect(record.messageId).toBeDefined()
    expect(record.receiptHandle).toBeDefined()
    expect(record.body).toBe('{}')
    expect(record.eventSource).toBe('aws:sqs')
    expect(record.attributes.ApproximateReceiveCount).toBe('1')
    expect(record.attributes.SentTimestamp).toBeDefined()
    expect(record.md5OfBody).toBeDefined()
    expect(record.awsRegion).toBeDefined()
    expect(record.eventSourceARN).toContain('arn:aws:sqs')
  })

  it('expands simplified records with body as object', () => {
    const event = buildSQSEvent({
      records: [
        { body: { orderId: '123', amount: 99.99 } },
      ],
    })

    expect(event.Records).toHaveLength(1)
    const record = event.Records[0]
    expect(record.body).toBe(JSON.stringify({ orderId: '123', amount: 99.99 }))
    expect(record.messageId).toBeDefined()
    expect(record.eventSource).toBe('aws:sqs')
  })

  it('generates unique messageIds for batch records', () => {
    const event = buildSQSEvent({
      records: [
        { body: { item: 1 } },
        { body: { item: 2 } },
        { body: { item: 3 } },
      ],
    })

    expect(event.Records).toHaveLength(3)
    const ids = event.Records.map((r) => r.messageId)
    expect(new Set(ids).size).toBe(3)
  })

  it('keeps body as string when provided as string', () => {
    const event = buildSQSEvent({
      records: [{ body: 'raw-string-message' }],
    })

    expect(event.Records[0].body).toBe('raw-string-message')
  })

  it('handles empty records array', () => {
    const event = buildSQSEvent({ records: [] })

    expect(event.Records).toHaveLength(0)
  })

  it('applies top-level overrides after record expansion', () => {
    const event = buildSQSEvent({
      records: [{ body: { test: true } }],
      Records: [
        {
          messageId: 'custom-id',
          receiptHandle: 'custom-handle',
          body: 'overridden',
          attributes: {
            ApproximateReceiveCount: '5',
            SentTimestamp: '123',
            SenderId: 'sender',
            ApproximateFirstReceiveTimestamp: '456',
          },
          messageAttributes: {},
          md5OfBody: 'custom-md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:custom-queue',
          awsRegion: 'us-east-1',
        },
      ],
    })

    // Records array from top-level override replaces expanded records (arrays replace entirely)
    expect(event.Records).toHaveLength(1)
    expect(event.Records[0].messageId).toBe('custom-id')
  })
})
