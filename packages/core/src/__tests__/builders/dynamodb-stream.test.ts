import { buildDynamoDBStreamEvent, marshall } from '../../builders/dynamodb-stream'

describe('marshall', () => {
  it('marshalls strings', () => {
    expect(marshall('hello')).toEqual({ S: 'hello' })
  })

  it('marshalls numbers', () => {
    expect(marshall(42)).toEqual({ N: '42' })
    expect(marshall(3.14)).toEqual({ N: '3.14' })
  })

  it('marshalls booleans', () => {
    expect(marshall(true)).toEqual({ BOOL: true })
    expect(marshall(false)).toEqual({ BOOL: false })
  })

  it('marshalls null', () => {
    expect(marshall(null)).toEqual({ NULL: true })
  })

  it('marshalls undefined as null', () => {
    expect(marshall(undefined)).toEqual({ NULL: true })
  })

  it('marshalls plain objects as maps', () => {
    expect(marshall({ name: 'Alice', age: 30 })).toEqual({
      M: {
        name: { S: 'Alice' },
        age: { N: '30' },
      },
    })
  })

  it('marshalls arrays as lists', () => {
    expect(marshall([1, 'two', true])).toEqual({
      L: [{ N: '1' }, { S: 'two' }, { BOOL: true }],
    })
  })

  it('falls back to String() for unknown types', () => {
    const sym = Symbol('test')
    expect(marshall(sym as any)).toEqual({ S: 'Symbol(test)' })
  })

  it('marshalls nested structures', () => {
    const result = marshall({
      user: { name: 'Bob', tags: ['admin', 'active'] },
    })

    expect(result).toEqual({
      M: {
        user: {
          M: {
            name: { S: 'Bob' },
            tags: {
              L: [{ S: 'admin' }, { S: 'active' }],
            },
          },
        },
      },
    })
  })
})

describe('buildDynamoDBStreamEvent', () => {
  it('returns a default event with INSERT record', () => {
    const event = buildDynamoDBStreamEvent()

    expect(event.Records).toHaveLength(1)
    const record = event.Records[0]
    expect(record.eventName).toBe('INSERT')
    expect(record.eventSource).toBe('aws:dynamodb')
    expect(record.awsRegion).toBeDefined()
    expect(record.eventID).toBeDefined()
    expect(record.eventVersion).toBe('1.1')
    expect(record.eventSourceARN).toContain('arn:aws:dynamodb')
    expect(record.dynamodb).toBeDefined()
    expect(record.dynamodb!.ApproximateCreationDateTime).toBeDefined()
    expect(record.dynamodb!.SequenceNumber).toBeDefined()
    expect(record.dynamodb!.StreamViewType).toBe('NEW_AND_OLD_IMAGES')
  })

  it('builds INSERT with marshalled keys and newImage', () => {
    const event = buildDynamoDBStreamEvent({
      records: [
        {
          eventName: 'INSERT',
          keys: { pk: 'USER#123', sk: 'PROFILE' },
          newImage: { pk: 'USER#123', sk: 'PROFILE', name: 'Alice', age: 30 },
        },
      ],
    })

    const record = event.Records[0]
    expect(record.eventName).toBe('INSERT')
    expect(record.dynamodb!.Keys).toEqual({
      pk: { S: 'USER#123' },
      sk: { S: 'PROFILE' },
    })
    expect(record.dynamodb!.NewImage).toEqual({
      pk: { S: 'USER#123' },
      sk: { S: 'PROFILE' },
      name: { S: 'Alice' },
      age: { N: '30' },
    })
    expect(record.dynamodb!.OldImage).toBeUndefined()
  })

  it('builds MODIFY with both newImage and oldImage', () => {
    const event = buildDynamoDBStreamEvent({
      records: [
        {
          eventName: 'MODIFY',
          keys: { id: 'item-1' },
          oldImage: { id: 'item-1', status: 'pending' },
          newImage: { id: 'item-1', status: 'active' },
        },
      ],
    })

    const record = event.Records[0]
    expect(record.eventName).toBe('MODIFY')
    expect(record.dynamodb!.StreamViewType).toBe('NEW_AND_OLD_IMAGES')
    expect(record.dynamodb!.OldImage).toEqual({
      id: { S: 'item-1' },
      status: { S: 'pending' },
    })
    expect(record.dynamodb!.NewImage).toEqual({
      id: { S: 'item-1' },
      status: { S: 'active' },
    })
  })

  it('builds REMOVE with only oldImage', () => {
    const event = buildDynamoDBStreamEvent({
      records: [
        {
          eventName: 'REMOVE',
          keys: { id: 'deleted-1' },
          oldImage: { id: 'deleted-1', data: 'gone' },
        },
      ],
    })

    const record = event.Records[0]
    expect(record.eventName).toBe('REMOVE')
    expect(record.dynamodb!.StreamViewType).toBe('OLD_IMAGE')
    expect(record.dynamodb!.OldImage).toEqual({
      id: { S: 'deleted-1' },
      data: { S: 'gone' },
    })
    expect(record.dynamodb!.NewImage).toBeUndefined()
  })

  it('passes through pre-marshalled AttributeValues', () => {
    const event = buildDynamoDBStreamEvent({
      records: [
        {
          eventName: 'INSERT',
          keys: { pk: { S: 'pre-marshalled' } },
          newImage: {
            pk: { S: 'pre-marshalled' },
            count: { N: '99' },
          },
        },
      ],
    })

    const record = event.Records[0]
    expect(record.dynamodb!.Keys).toEqual({
      pk: { S: 'pre-marshalled' },
    })
    expect(record.dynamodb!.NewImage).toEqual({
      pk: { S: 'pre-marshalled' },
      count: { N: '99' },
    })
  })

  it('applies additional record overrides via deepMerge', () => {
    const event = buildDynamoDBStreamEvent({
      records: [{
        eventName: 'INSERT',
        keys: { id: 'x' },
        awsRegion: 'eu-west-1',
      }],
    })
    expect(event.Records[0].awsRegion).toBe('eu-west-1')
  })

  it('applies top-level overrides after record expansion', () => {
    const event = buildDynamoDBStreamEvent({
      records: [{ eventName: 'INSERT', keys: { id: '1' } }],
      Records: [{ eventID: 'custom-id' } as any],
    } as any)
    // Top-level Records override replaces expanded records
    expect(event.Records[0].eventID).toBe('custom-id')
  })

  it('generates unique eventIDs per record', () => {
    const event = buildDynamoDBStreamEvent({
      records: [
        { eventName: 'INSERT', keys: { id: '1' } },
        { eventName: 'INSERT', keys: { id: '2' } },
      ],
    })

    expect(event.Records).toHaveLength(2)
    expect(event.Records[0].eventID).not.toBe(event.Records[1].eventID)
  })
})
