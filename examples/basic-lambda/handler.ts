import type { Context } from 'aws-lambda'

interface Response {
  statusCode: number
  body: string
}

export const handler = async (
  _event: unknown,
  context: Context,
): Promise<Response> => {
  const remaining = context.getRemainingTimeInMillis()

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda!',
      functionName: context.functionName,
      remainingTime: remaining,
      requestId: context.awsRequestId,
    }),
  }
}
