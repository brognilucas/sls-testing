import { buildSQSEvent, buildLambdaContext } from '@sls-testing/core'
import { handler } from './handler'

// Register Jest matchers
import '@sls-testing/jest'

describe('SQS Consumer Handler', () => {
  it('processes all valid orders successfully', async () => {
    const event = buildSQSEvent({
      records: [
        { body: { orderId: 'order-1', amount: 99.9 } },
        { body: { orderId: 'order-2', amount: 49.9 } },
      ],
    })

    const result = await handler(event)

    expect(result).toHaveNoFailedMessages()
  })

  it('reports failed messages for invalid orders', async () => {
    const event = buildSQSEvent({
      records: [
        { body: { orderId: 'order-1', amount: 99.9 } },
        { body: { orderId: 'order-2', amount: 0.5 } },
      ],
    })

    const result = await handler(event)
    const failedId = event.Records[1].messageId

    expect(result).toHaveFailedMessage(failedId)
  })

  it('handles batch with all failures', async () => {
    const event = buildSQSEvent({
      records: [
        { body: { orderId: 'order-1', amount: 0.1 } },
        { body: { orderId: 'order-2', amount: 0.2 } },
      ],
    })

    const result = await handler(event)

    expect(result.batchItemFailures).toHaveLength(2)
  })
})
