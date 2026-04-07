import { buildSNSEvent } from '../../builders/sns'

describe('buildSNSEvent', () => {
  it('returns a default SNS event with PascalCase fields', () => {
    const event = buildSNSEvent()

    expect(event.Records).toHaveLength(1)
    const record = event.Records[0]
    expect(record.EventVersion).toBe('1.0')
    expect(record.EventSource).toBe('aws:sns')
    expect(record.EventSubscriptionArn).toContain('arn:aws:sns')
    expect(record.Sns).toBeDefined()
    expect(record.Sns.MessageId).toBeDefined()
    expect(record.Sns.Message).toBe('{}')
    expect(record.Sns.Timestamp).toBeDefined()
    expect(record.Sns.Signature).toBeDefined()
    expect(record.Sns.SignatureVersion).toBe('1')
    expect(record.Sns.SigningCertUrl).toBeDefined()
    expect(record.Sns.UnsubscribeUrl).toBeDefined()
    expect(record.Sns.TopicArn).toContain('arn:aws:sns')
    expect(record.Sns.Type).toBe('Notification')
    expect(record.Sns.MessageAttributes).toEqual({})
  })

  it('auto-serializes message objects', () => {
    const event = buildSNSEvent({
      records: [{ message: { userId: '42', action: 'signup' } }],
    })

    expect(event.Records[0].Sns.Message).toBe(
      JSON.stringify({ userId: '42', action: 'signup' }),
    )
  })

  it('keeps message as string when provided as string', () => {
    const event = buildSNSEvent({
      records: [{ message: 'plain-text-notification' }],
    })

    expect(event.Records[0].Sns.Message).toBe('plain-text-notification')
  })

  it('overrides topicArn per record', () => {
    const customArn = 'arn:aws:sns:us-west-2:999888777666:custom-topic'
    const event = buildSNSEvent({
      records: [{ message: 'hello', topicArn: customArn }],
    })

    expect(event.Records[0].Sns.TopicArn).toBe(customArn)
    expect(event.Records[0].EventSubscriptionArn).toContain(customArn)
  })

  it('handles multiple records with unique MessageIds', () => {
    const event = buildSNSEvent({
      records: [
        { message: 'first' },
        { message: 'second' },
        { message: 'third' },
      ],
    })

    expect(event.Records).toHaveLength(3)
    const ids = event.Records.map((r) => r.Sns.MessageId)
    expect(new Set(ids).size).toBe(3)
    expect(event.Records[0].Sns.Message).toBe('first')
    expect(event.Records[1].Sns.Message).toBe('second')
    expect(event.Records[2].Sns.Message).toBe('third')
  })
})
