import { buildS3Event } from '../../builders/s3'

describe('buildS3Event', () => {
  it('returns a complete S3 event with no args', () => {
    const event = buildS3Event()

    expect(event.Records).toHaveLength(1)
    const record = event.Records[0]
    expect(record.eventSource).toBe('aws:s3')
    expect(record.eventName).toBe('ObjectCreated:Put')
    expect(record.s3.bucket.name).toBe('test-bucket')
    expect(record.s3.object.key).toBe('test-key')
    expect(record.s3.bucket.arn).toBe('arn:aws:s3:::test-bucket')
    expect(record.s3.s3SchemaVersion).toBe('1.0')
    expect(record.responseElements['x-amz-request-id']).toBeDefined()
  })

  it('maps bucket and key shorthands to full event', () => {
    const event = buildS3Event({
      bucket: 'my-bucket',
      key: 'uploads/photo.jpg',
    })

    const record = event.Records[0]
    expect(record.s3.bucket.name).toBe('my-bucket')
    expect(record.s3.bucket.arn).toBe('arn:aws:s3:::my-bucket')
    expect(record.s3.object.key).toBe('uploads/photo.jpg')
  })

  it('defaults eventName to ObjectCreated:Put', () => {
    const event = buildS3Event({ bucket: 'b', key: 'k' })

    expect(event.Records[0].eventName).toBe('ObjectCreated:Put')
  })

  it('overrides eventName', () => {
    const event = buildS3Event({
      bucket: 'my-bucket',
      key: 'deleted-file.txt',
      eventName: 'ObjectRemoved:Delete',
    })

    expect(event.Records[0].eventName).toBe('ObjectRemoved:Delete')
  })

  it('applies deep overrides via Records', () => {
    const event = buildS3Event({
      Records: [
        {
          eventVersion: '2.1',
          eventSource: 'aws:s3',
          awsRegion: 'eu-west-1',
          eventTime: '2024-01-01T00:00:00.000Z',
          eventName: 'ObjectCreated:Copy',
          userIdentity: { principalId: 'CUSTOM' },
          requestParameters: { sourceIPAddress: '10.0.0.1' },
          responseElements: {
            'x-amz-request-id': 'custom-req',
            'x-amz-id-2': 'custom-id2',
          },
          s3: {
            s3SchemaVersion: '1.0',
            configurationId: 'custom',
            bucket: {
              name: 'deep-bucket',
              ownerIdentity: { principalId: 'OWNER' },
              arn: 'arn:aws:s3:::deep-bucket',
            },
            object: {
              key: 'deep-key',
              size: 2048,
              eTag: 'etag',
              sequencer: '123',
            },
          },
        },
      ],
    })

    expect(event.Records[0].awsRegion).toBe('eu-west-1')
    expect(event.Records[0].s3.bucket.name).toBe('deep-bucket')
  })
})
