import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const orderId = event.pathParameters?.id

  if (!orderId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Order ID is required' }),
    }
  }

  const tableName = process.env.ORDERS_TABLE

  if (!tableName) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ORDERS_TABLE not configured' }),
    }
  }

  // Simulated lookup — in a real app this reads from DynamoDB
  // Return a mock order for demonstration
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      product: 'Widget',
      amount: 29.99,
      status: 'pending',
      table: tableName,
    }),
  }
}
