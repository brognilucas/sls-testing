import { buildEventBridgeEvent } from '../../builders/eventbridge'

describe('buildEventBridgeEvent', () => {
  it('auto-generates required fields with no args', () => {
    const event = buildEventBridgeEvent()

    expect(event.id).toBeDefined()
    expect(event.version).toBe('0')
    expect(event.account).toBeDefined()
    expect(event.time).toBeDefined()
    expect(event.region).toBeDefined()
    expect(event.resources).toEqual([])
    expect(event.source).toBe('test.source')
    expect(event['detail-type']).toBe('TestDetailType')
    expect(event.detail).toEqual({})
  })

  it('supports generic type for detail', () => {
    interface OrderDetail {
      orderId: string
      amount: number
    }

    const event = buildEventBridgeEvent<OrderDetail>({
      source: 'orders.service',
      'detail-type': 'OrderCreated',
      detail: { orderId: 'abc-123', amount: 42.5 },
    })

    expect(event.source).toBe('orders.service')
    expect(event['detail-type']).toBe('OrderCreated')
    expect(event.detail.orderId).toBe('abc-123')
    expect(event.detail.amount).toBe(42.5)
  })

  it('defaults resources to empty array', () => {
    const event = buildEventBridgeEvent()

    expect(event.resources).toEqual([])
  })

  it('overrides resources', () => {
    const event = buildEventBridgeEvent({
      resources: ['arn:aws:s3:::my-bucket'],
    })

    expect(event.resources).toEqual(['arn:aws:s3:::my-bucket'])
  })

  it('handles hyphenated fields (detail-type, replay-name)', () => {
    const event = buildEventBridgeEvent({
      'detail-type': 'CustomType',
      'replay-name': 'my-replay',
    })

    expect(event['detail-type']).toBe('CustomType')
    expect(event['replay-name']).toBe('my-replay')
  })

  it('preserves auto-generated id and time', () => {
    const event1 = buildEventBridgeEvent()
    const event2 = buildEventBridgeEvent()

    expect(event1.id).not.toBe(event2.id)
  })
})
