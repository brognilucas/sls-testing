import type { SQSEvent, SQSBatchResponse } from 'aws-lambda'

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const failures: Array<{ itemIdentifier: string }> = []

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body)

      // Simulate processing — orders under $1 are rejected
      if (body.amount < 1) {
        throw new Error('Order amount too small')
      }

      console.log(`Processed order ${body.orderId}`)
    } catch {
      failures.push({ itemIdentifier: record.messageId })
    }
  }

  return { batchItemFailures: failures }
}
