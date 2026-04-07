import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

// In a real app, this would write to DynamoDB
const orders = new Map<string, Record<string, unknown>>()

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Request body is required' }),
    }
  }

  const body = JSON.parse(event.body)
  const tableName = process.env.ORDERS_TABLE

  if (!tableName) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ORDERS_TABLE not configured' }),
    }
  }

  const orderId = `ord_${Date.now()}`
  const order = {
    orderId,
    ...body,
    status: 'pending',
    table: tableName,
    createdAt: new Date().toISOString(),
  }

  orders.set(orderId, order)

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  }
}
