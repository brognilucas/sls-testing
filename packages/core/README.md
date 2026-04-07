# @sls-testing/core

Typed event builders, Lambda context mock, and response asserters for testing AWS Lambda functions.

Framework-agnostic. Works with Jest, Vitest, or any test runner.

## Install

```bash
npm install @sls-testing/core --save-dev
```

Requires `@types/aws-lambda` as a peer dependency:

```bash
npm install @types/aws-lambda --save-dev
```

## Event Builders

Every builder returns a fully-typed event with sensible defaults. Pass a partial override to customize any field.

### API Gateway

```typescript
import { buildApiGatewayEvent, buildApiGatewayV1Event } from '@sls-testing/core'

// HTTP API (v2) — default
const event = buildApiGatewayEvent({
  requestContext: { http: { method: 'POST' } },
  rawPath: '/users',
  body: JSON.stringify({ name: 'Lucas' }),
})

// REST API (v1)
const v1Event = buildApiGatewayV1Event({
  httpMethod: 'GET',
  path: '/users',
  pathParameters: { id: '42' },
})
```

### SQS

```typescript
import { buildSQSEvent } from '@sls-testing/core'

const event = buildSQSEvent({
  records: [
    { body: { orderId: 'abc-123', amount: 99.9 } },
    { body: { orderId: 'def-456', amount: 49.9 } },
  ],
})
// Bodies are auto-serialized to JSON strings
// Each record gets a unique messageId
```

### S3

```typescript
import { buildS3Event } from '@sls-testing/core'

const event = buildS3Event({
  bucket: 'my-bucket',
  key: 'uploads/image.png',
  eventName: 'ObjectCreated:Put', // default
})
```

### EventBridge

```typescript
import { buildEventBridgeEvent } from '@sls-testing/core'

const event = buildEventBridgeEvent({
  source: 'app.orders',
  'detail-type': 'OrderPlaced',
  detail: { orderId: 'abc-123' },
})
```

### SNS

```typescript
import { buildSNSEvent } from '@sls-testing/core'

const event = buildSNSEvent({
  records: [{ message: { action: 'notify' }, topicArn: 'arn:aws:sns:...' }],
})
```

### DynamoDB Streams

```typescript
import { buildDynamoDBStreamEvent } from '@sls-testing/core'

const event = buildDynamoDBStreamEvent({
  records: [{
    eventName: 'INSERT',
    keys: { id: 'abc' },
    newImage: { id: 'abc', name: 'Lucas', count: 42 },
  }],
})
// Values are auto-marshalled to DynamoDB AttributeValue format
```

## Lambda Context Mock

```typescript
import { buildLambdaContext } from '@sls-testing/core'

const context = buildLambdaContext({
  functionName: 'my-service-dev-processOrder',
  memoryLimitInMB: '512',
  remainingTimeOverride: 3000, // ms
})

context.getRemainingTimeInMillis() // 3000
```

## Response Asserters

Framework-agnostic assertion functions that throw on mismatch.

```typescript
import { assertApiResponse, assertSQSBatchResponse } from '@sls-testing/core'

assertApiResponse(response, {
  statusCode: 201,
  bodyContains: { userId: '123' },
  headers: { 'content-type': 'application/json' },
})

assertSQSBatchResponse(response, {
  failedMessageIds: ['msg-2'],
})
```

## License

MIT
