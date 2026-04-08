---
name: serverless-testing
description: Write tests for AWS Lambda functions using @sls-testing/core, @sls-testing/jest, and serverless-testing-plugin. Use when creating Lambda handlers, testing API Gateway endpoints (v1 REST and v2 HTTP), SQS consumers, S3 triggers, EventBridge rules, SNS subscribers, DynamoDB stream processors, or when the user mentions testing serverless functions, writing Lambda tests, or improving test coverage for serverless applications. Provides typed event builders with sensible defaults, Lambda context mocks, response asserters, and custom Jest matchers that eliminate AWS event boilerplate.
license: MIT
metadata:
  author: brognilucas
  version: "1.0.0"
---

# Testing AWS Lambda Functions with @sls-testing

## When to Apply

Use this skill when:
- Writing tests for any AWS Lambda handler (API Gateway, SQS, S3, EventBridge, SNS, DynamoDB Streams)
- Setting up a testing framework for a Serverless Framework project
- The user asks to test, add test coverage, or write tests for Lambda functions
- Creating new Lambda handlers that need corresponding tests
- Reviewing or improving existing Lambda test suites

## Why Test Lambda Functions

Lambda functions are the unit of deployment in serverless architectures. Despite being small, they interact with complex AWS event structures that are tedious to construct by hand. Without proper tooling, developers either skip tests entirely or write brittle tests with incomplete event mocks.

**Common problems this skill solves:**
- Constructing valid AWS event payloads (API Gateway events have 30+ fields)
- Mocking the Lambda Context object with realistic defaults
- Asserting response shapes (status codes, JSON bodies, SQS batch failures)
- Loading environment variables from serverless.yml into tests
- Maintaining type safety between event inputs and handler signatures

## The Three Libraries

| Package | Purpose | Install |
|---------|---------|---------|
| `@sls-testing/core` | Event builders, context mock, response asserters. Framework-agnostic. | `npm i -D @sls-testing/core @types/aws-lambda` |
| `@sls-testing/jest` | Custom Jest matchers that wrap core asserters. Auto-registers on import. | `npm i -D @sls-testing/jest` |
| `serverless-testing-plugin` | Reads serverless.yml metadata and loads .env.test for tests. | `npm i -D serverless-testing-plugin` |

## What to Test by Lambda Type

| Lambda Type | What to Test | Event Builder |
|-------------|-------------|---------------|
| **API Gateway (REST v1)** | Route handling, request parsing, status codes, response body, error responses | `buildApiGatewayV1Event()` |
| **API Gateway (HTTP v2)** | Same as v1, plus v2-specific fields (rawPath, requestContext.http) | `buildApiGatewayV2Event()` |
| **SQS Consumer** | Message processing, batch failure reporting, partial failure handling | `buildSQSEvent()` |
| **S3 Trigger** | Object key parsing, bucket routing, event type filtering | `buildS3Event()` |
| **EventBridge** | Detail parsing, source/detail-type routing, replay handling | `buildEventBridgeEvent()` |
| **SNS Subscriber** | Message parsing, topic routing, batch processing | `buildSNSEvent()` |
| **DynamoDB Stream** | INSERT/MODIFY/REMOVE handling, image parsing, key extraction | `buildDynamoDBStreamEvent()` |

**For every Lambda type, always test:**
1. **Happy path** -- valid input produces expected output
2. **Input validation** -- missing/malformed fields return proper errors
3. **Error handling** -- downstream failures are caught and reported correctly
4. **Edge cases** -- empty batches, large payloads, missing optional fields

## Quick Start

### 1. Install dependencies

```bash
npm install --save-dev @sls-testing/core @sls-testing/jest @types/aws-lambda
```

### 2. Configure Jest

```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "setupFilesAfterEnv": ["@sls-testing/jest"]
}
```

Or import directly in each test file:

```typescript
import '@sls-testing/jest'
```

### 3. Write your first test

```typescript
import { buildApiGatewayV2Event, buildLambdaContext } from '@sls-testing/core'
import '@sls-testing/jest'
import { handler } from './handler'

describe('GET /users', () => {
  it('returns 200 with user list', async () => {
    const event = buildApiGatewayV2Event({
      requestContext: { http: { method: 'GET' } },
      rawPath: '/users',
    })

    const result = await handler(event)

    expect(result).toHaveStatusCode(200)
    expect(result).toBeSuccessfulApiResponse()
  })
})
```

## Event Builders -- Core Concepts

Every builder follows the same pattern:
1. Returns a **fully-typed, complete AWS event** with sensible defaults
2. Accepts a **partial override object** -- only specify what matters for your test
3. Uses **deep merge** -- nested overrides don't clobber sibling fields
4. **Auto-serializes** bodies and values where appropriate (JSON.stringify for SQS/SNS bodies, DynamoDB marshalling)

### API Gateway v2 (HTTP API)

```typescript
import { buildApiGatewayV2Event } from '@sls-testing/core'

// Minimal -- defaults to GET
const event = buildApiGatewayV2Event()

// Override method, path, and body
const postEvent = buildApiGatewayV2Event({
  requestContext: { http: { method: 'POST' } },
  rawPath: '/users',
  body: JSON.stringify({ name: 'Lucas' }),
})

// With path parameters and query strings
const getEvent = buildApiGatewayV2Event({
  requestContext: { http: { method: 'GET' } },
  rawPath: '/users/42',
  pathParameters: { id: '42' },
  queryStringParameters: { include: 'orders' },
})
```

### API Gateway v1 (REST API)

```typescript
import { buildApiGatewayV1Event } from '@sls-testing/core'

const event = buildApiGatewayV1Event({
  httpMethod: 'POST',
  path: '/orders',
  body: JSON.stringify({ product: 'Widget', amount: 29.99 }),
  pathParameters: { id: 'ord_123' },
})
```

### SQS

```typescript
import { buildSQSEvent } from '@sls-testing/core'

// Bodies are auto-serialized to JSON strings
// Each record gets a unique messageId
const event = buildSQSEvent({
  records: [
    { body: { orderId: 'order-1', amount: 99.9 } },
    { body: { orderId: 'order-2', amount: 49.9 } },
  ],
})

// Access generated messageIds for assertion
const firstMessageId = event.Records[0].messageId
```

### S3

```typescript
import { buildS3Event } from '@sls-testing/core'

const event = buildS3Event({
  bucket: 'my-uploads',
  key: 'images/photo.png',
  eventName: 'ObjectCreated:Put',
})
```

### EventBridge

```typescript
import { buildEventBridgeEvent } from '@sls-testing/core'

const event = buildEventBridgeEvent({
  source: 'app.orders',
  'detail-type': 'OrderPlaced',
  detail: { orderId: 'abc-123', amount: 99.9 },
})
```

### SNS

```typescript
import { buildSNSEvent } from '@sls-testing/core'

const event = buildSNSEvent({
  records: [{ message: { action: 'notify', userId: 'u_1' }, topicArn: 'arn:aws:sns:us-east-1:123456789012:alerts' }],
})
```

### DynamoDB Streams

```typescript
import { buildDynamoDBStreamEvent } from '@sls-testing/core'

// Values are auto-marshalled to DynamoDB AttributeValue format
const event = buildDynamoDBStreamEvent({
  records: [{
    eventName: 'INSERT',
    keys: { id: 'abc' },
    newImage: { id: 'abc', name: 'Lucas', count: 42 },
  }],
})
```

## Lambda Context Mock

```typescript
import { buildLambdaContext } from '@sls-testing/core'

const context = buildLambdaContext({
  functionName: 'my-service-dev-processOrder',
  memoryLimitInMB: '512',
  remainingTimeOverride: 3000, // milliseconds
})

context.functionName          // 'my-service-dev-processOrder'
context.getRemainingTimeInMillis() // 3000
context.awsRequestId          // auto-generated UUID
```

## Jest Matchers

Import `@sls-testing/jest` to extend `expect()` with Lambda-specific matchers.

```typescript
import '@sls-testing/jest'

// Status code matchers
expect(response).toHaveStatusCode(200)
expect(response).toBeSuccessfulApiResponse() // 2xx
expect(response).toBeClientError()           // 4xx
expect(response).toBeServerError()           // 5xx

// Response shape matching (parses JSON body, supports asymmetric matchers)
expect(response).toMatchLambdaResponse({
  statusCode: 201,
  body: { userId: expect.any(String) },
  headers: { 'content-type': 'application/json' },
})

// SQS batch matchers
expect(sqsResponse).toHaveNoFailedMessages()
expect(sqsResponse).toHaveFailedMessage('msg-id-2')

// Side effect verification
const spy = jest.spyOn(service, 'sendEmail')
await handler(event, context)
expect(spy).toHaveNoSideEffects()
```

## Serverless Plugin Integration

For projects using Serverless Framework, the plugin bridges serverless.yml config into your tests.

```typescript
import { ServerlessTestingPlugin } from 'serverless-testing-plugin'
import { buildApiGatewayV1Event, buildLambdaContext } from '@sls-testing/core'
import '@sls-testing/jest'

const serverless = {
  service: {
    service: 'order-service',
    functions: {
      processOrder: {
        handler: 'src/handlers/process-order.handler',
        memorySize: 512,
        timeout: 30,
        runtime: 'nodejs20.x',
        environment: {
          ORDERS_TABLE: 'orders-dev',
          NOTIFICATION_TOPIC: 'arn:aws:sns:us-east-1:123456789012:notifications',
        },
        events: [{ http: { path: '/orders', method: 'post' } }],
      },
    },
    provider: { stage: 'dev', region: 'us-east-1' },
  },
  config: { servicePath: __dirname },
} as any

const plugin = new ServerlessTestingPlugin(serverless, {})
const fnConfig = plugin.getFunction('processOrder')

beforeAll(() => {
  if (fnConfig.environment) {
    for (const [key, value] of Object.entries(fnConfig.environment)) {
      process.env[key] = value
    }
  }
})

const context = buildLambdaContext({
  functionName: fnConfig.name,
  memoryLimitInMB: String(fnConfig.memorySize),
  remainingTimeOverride: (fnConfig.timeout ?? 30) * 1000,
})
```

## Testing Patterns

### Arrange-Act-Assert

Every test should follow this structure:

```typescript
it('creates an order from POST request', async () => {
  // Arrange -- build the event
  const event = buildApiGatewayV2Event({
    requestContext: { http: { method: 'POST' } },
    body: JSON.stringify({ product: 'Widget' }),
  })

  // Act -- call the handler
  const result = await handler(event)

  // Assert -- verify the response
  expect(result).toHaveStatusCode(201)
  expect(result).toMatchLambdaResponse({
    body: { product: 'Widget', status: 'pending' },
  })
})
```

### Testing Error Paths

```typescript
it('returns 400 when body is missing', async () => {
  const event = buildApiGatewayV2Event({
    requestContext: { http: { method: 'POST' } },
  })

  const result = await handler(event)

  expect(result).toBeClientError()
})

it('returns 405 for unsupported methods', async () => {
  const event = buildApiGatewayV2Event({
    requestContext: { http: { method: 'DELETE' } },
  })

  const result = await handler(event)

  expect(result).toHaveStatusCode(405)
})
```

### Testing SQS Partial Batch Failures

```typescript
it('reports failures for invalid records', async () => {
  const event = buildSQSEvent({
    records: [
      { body: { orderId: 'order-1', amount: 99.9 } },  // valid
      { body: { orderId: 'order-2', amount: 0.5 } },    // will fail
    ],
  })

  const result = await handler(event)

  expect(result).toHaveFailedMessage(event.Records[1].messageId)
})

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
```

### Testing with Lambda Context

```typescript
it('uses function metadata from context', async () => {
  const context = buildLambdaContext({
    functionName: 'my-hello-function',
    remainingTimeOverride: 5000,
  })

  const result = await handler({}, context)

  expect(result).toHaveStatusCode(200)
  const body = JSON.parse(result.body)
  expect(body.functionName).toBe('my-hello-function')
  expect(body.remainingTime).toBe(5000)
})
```

### Testing with Environment Variables

```typescript
describe('handler with env config', () => {
  beforeAll(() => {
    process.env.ORDERS_TABLE = 'orders-test'
  })

  afterAll(() => {
    delete process.env.ORDERS_TABLE
  })

  it('reads table name from env', async () => {
    const event = buildApiGatewayV1Event({
      httpMethod: 'GET',
      pathParameters: { id: 'ord_123' },
    })

    const result = await handler(event)
    expect(result).toMatchLambdaResponse({ body: { table: 'orders-test' } })
  })
})
```

## Mocking External Services

The sls-testing libraries handle **event construction and response assertion**. For mocking AWS SDK calls within your handler, use `aws-sdk-client-mock`:

```typescript
import { mockClient } from 'aws-sdk-client-mock'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

const ddbMock = mockClient(DynamoDBDocumentClient)

beforeEach(() => ddbMock.reset())

it('saves to DynamoDB', async () => {
  ddbMock.on(PutCommand).resolves({})

  const event = buildApiGatewayV2Event({
    requestContext: { http: { method: 'POST' } },
    body: JSON.stringify({ name: 'Widget' }),
  })

  const result = await handler(event)

  expect(result).toHaveStatusCode(201)
  expect(ddbMock.calls()).toHaveLength(1)
})
```

**Rule: mock at the I/O boundary, not internal functions.** Let business logic run for real; only mock the network/database/filesystem calls.

## Detailed API Reference

For complete API signatures, all builder options, and advanced patterns, see:

- [references/core-api.md](references/core-api.md) -- Full @sls-testing/core API (event builders, context, asserters, utilities)
- [references/jest-matchers.md](references/jest-matchers.md) -- All Jest matchers with examples
- [references/serverless-plugin.md](references/serverless-plugin.md) -- Plugin configuration and metadata API
- [references/patterns.md](references/patterns.md) -- Advanced testing patterns, factory functions, and troubleshooting
