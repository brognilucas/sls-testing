# Testing Patterns and Best Practices

## Table of Contents

1. [Test Structure](#test-structure)
2. [Testing Each Lambda Type](#testing-each-lambda-type)
3. [Mocking External Services](#mocking-external-services)
4. [Environment Variables](#environment-variables)
5. [Error Path Testing](#error-path-testing)
6. [Factory Functions](#factory-functions)
7. [Testing Time-Dependent Code](#testing-time-dependent-code)
8. [Testing Partial Batch Failures](#testing-partial-batch-failures)
9. [Testing DynamoDB Stream Processors](#testing-dynamodb-stream-processors)
10. [Jest Configuration](#jest-configuration)
11. [Troubleshooting](#troubleshooting)

---

## Test Structure

### Arrange-Act-Assert

Every test follows three phases:

```typescript
it('creates an order from POST request', async () => {
  // Arrange -- build inputs
  const event = buildApiGatewayV2Event({
    requestContext: { http: { method: 'POST' } },
    body: JSON.stringify({ product: 'Widget' }),
  })
  const context = buildLambdaContext({ functionName: 'processOrder' })

  // Act -- call the handler
  const result = await handler(event, context)

  // Assert -- verify outputs
  expect(result).toHaveStatusCode(201)
  expect(result).toMatchLambdaResponse({
    body: { product: 'Widget', status: 'pending' },
  })
})
```

### Descriptive Test Names

Name tests by the scenario they verify, not the implementation:

```typescript
// Good -- describes the behavior
describe('POST /orders', () => {
  it('creates an order with valid input', async () => { ... })
  it('returns 400 when body is missing', async () => { ... })
  it('returns 400 when product name exceeds 100 characters', async () => { ... })
  it('returns 500 when DynamoDB is unavailable', async () => { ... })
})

// Bad -- describes the implementation
describe('handler', () => {
  it('calls DynamoDB.putItem', async () => { ... })
  it('returns JSON', async () => { ... })
})
```

### Test Independence

Each test must be self-contained. Never share mutable state between tests:

```typescript
// Good -- each test builds its own event
it('handles order-1', async () => {
  const event = buildSQSEvent({ records: [{ body: { orderId: 'order-1' } }] })
  const result = await handler(event)
  expect(result).toHaveNoFailedMessages()
})

it('handles order-2', async () => {
  const event = buildSQSEvent({ records: [{ body: { orderId: 'order-2' } }] })
  const result = await handler(event)
  expect(result).toHaveNoFailedMessages()
})
```

---

## Testing Each Lambda Type

### API Gateway (v2 HTTP API)

```typescript
import { buildApiGatewayV2Event } from '@sls-testing/core'
import '@sls-testing/jest'
import { handler } from './handler'

describe('API Gateway v2 Handler', () => {
  it('returns 200 for GET requests', async () => {
    const event = buildApiGatewayV2Event({
      requestContext: { http: { method: 'GET' } },
      rawPath: '/users',
    })

    const result = await handler(event)

    expect(result).toHaveStatusCode(200)
    expect(result).toBeSuccessfulApiResponse()
  })

  it('creates a resource on POST with body', async () => {
    const event = buildApiGatewayV2Event({
      requestContext: { http: { method: 'POST' } },
      rawPath: '/users',
      body: JSON.stringify({ name: 'Lucas' }),
    })

    const result = await handler(event)

    expect(result).toHaveStatusCode(201)
    expect(result).toMatchLambdaResponse({
      body: { userId: expect.any(String), name: 'Lucas' },
    })
  })

  it('returns 400 for POST without body', async () => {
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
})
```

### API Gateway (v1 REST API)

```typescript
import { buildApiGatewayV1Event } from '@sls-testing/core'
import '@sls-testing/jest'
import { handler } from './handler'

describe('API Gateway v1 Handler', () => {
  it('returns an order by ID', async () => {
    const event = buildApiGatewayV1Event({
      httpMethod: 'GET',
      path: '/orders/ord_123',
      pathParameters: { id: 'ord_123' },
    })

    const result = await handler(event)

    expect(result).toHaveStatusCode(200)
    expect(result).toMatchLambdaResponse({
      body: { orderId: 'ord_123' },
    })
  })

  it('returns 400 when ID is missing', async () => {
    const event = buildApiGatewayV1Event({
      httpMethod: 'GET',
      path: '/orders/',
    })

    const result = await handler(event)

    expect(result).toBeClientError()
  })
})
```

### SQS Consumer

```typescript
import { buildSQSEvent, buildLambdaContext } from '@sls-testing/core'
import '@sls-testing/jest'
import { handler } from './handler'

describe('SQS Consumer', () => {
  it('processes all valid records', async () => {
    const event = buildSQSEvent({
      records: [
        { body: { orderId: 'order-1', amount: 99.9 } },
        { body: { orderId: 'order-2', amount: 49.9 } },
      ],
    })

    const result = await handler(event)

    expect(result).toHaveNoFailedMessages()
  })

  it('reports failures for invalid records', async () => {
    const event = buildSQSEvent({
      records: [
        { body: { orderId: 'order-1', amount: 99.9 } },
        { body: { orderId: 'order-2', amount: 0.5 } },
      ],
    })

    const result = await handler(event)

    expect(result).toHaveFailedMessage(event.Records[1].messageId)
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
```

### S3 Trigger

```typescript
import { buildS3Event } from '@sls-testing/core'
import '@sls-testing/jest'
import { handler } from './handler'

describe('S3 Trigger Handler', () => {
  it('processes uploaded images', async () => {
    const event = buildS3Event({
      bucket: 'my-uploads',
      key: 'images/photo.png',
      eventName: 'ObjectCreated:Put',
    })

    const result = await handler(event)

    expect(result).toHaveStatusCode(200)
  })

  it('ignores non-image files', async () => {
    const event = buildS3Event({
      bucket: 'my-uploads',
      key: 'documents/readme.txt',
    })

    const result = await handler(event)

    expect(result).toMatchLambdaResponse({
      body: { skipped: true },
    })
  })
})
```

### EventBridge

```typescript
import { buildEventBridgeEvent } from '@sls-testing/core'
import '@sls-testing/jest'
import { handler } from './handler'

describe('EventBridge Handler', () => {
  it('processes OrderPlaced events', async () => {
    const event = buildEventBridgeEvent({
      source: 'app.orders',
      'detail-type': 'OrderPlaced',
      detail: { orderId: 'abc-123', amount: 99.9 },
    })

    const result = await handler(event)

    expect(result).toMatchLambdaResponse({
      body: { processed: true, orderId: 'abc-123' },
    })
  })

  it('ignores unknown event types', async () => {
    const event = buildEventBridgeEvent({
      source: 'app.unknown',
      'detail-type': 'UnknownEvent',
      detail: {},
    })

    const result = await handler(event)

    expect(result).toMatchLambdaResponse({
      body: { skipped: true },
    })
  })
})
```

### SNS Subscriber

```typescript
import { buildSNSEvent } from '@sls-testing/core'
import '@sls-testing/jest'
import { handler } from './handler'

describe('SNS Subscriber', () => {
  it('processes notification messages', async () => {
    const event = buildSNSEvent({
      records: [{
        message: { action: 'notify', userId: 'u_123' },
        topicArn: 'arn:aws:sns:us-east-1:123456789012:notifications',
      }],
    })

    const result = await handler(event)

    expect(result).toHaveStatusCode(200)
  })
})
```

### DynamoDB Stream Processor

```typescript
import { buildDynamoDBStreamEvent } from '@sls-testing/core'
import '@sls-testing/jest'
import { handler } from './handler'

describe('DynamoDB Stream Processor', () => {
  it('handles INSERT events', async () => {
    const event = buildDynamoDBStreamEvent({
      records: [{
        eventName: 'INSERT',
        keys: { id: 'user-1' },
        newImage: { id: 'user-1', name: 'Lucas', email: 'lucas@example.com' },
      }],
    })

    const result = await handler(event)

    expect(result).toMatchLambdaResponse({
      body: { synced: 1 },
    })
  })

  it('handles MODIFY events', async () => {
    const event = buildDynamoDBStreamEvent({
      records: [{
        eventName: 'MODIFY',
        keys: { id: 'user-1' },
        oldImage: { id: 'user-1', name: 'Lucas' },
        newImage: { id: 'user-1', name: 'Lucas B.' },
      }],
    })

    const result = await handler(event)

    expect(result).toMatchLambdaResponse({
      body: { updated: 1 },
    })
  })

  it('handles REMOVE events', async () => {
    const event = buildDynamoDBStreamEvent({
      records: [{
        eventName: 'REMOVE',
        keys: { id: 'user-1' },
        oldImage: { id: 'user-1', name: 'Lucas' },
      }],
    })

    const result = await handler(event)

    expect(result).toMatchLambdaResponse({
      body: { deleted: 1 },
    })
  })
})
```

### Basic Lambda (with Context)

```typescript
import { buildLambdaContext } from '@sls-testing/core'
import '@sls-testing/jest'
import { handler } from './handler'

describe('Basic Lambda', () => {
  it('returns function metadata from context', async () => {
    const context = buildLambdaContext({
      functionName: 'my-hello-function',
    })

    const result = await handler({}, context)

    expect(result).toHaveStatusCode(200)
    const body = JSON.parse(result.body)
    expect(body.functionName).toBe('my-hello-function')
    expect(body.requestId).toBeDefined()
  })

  it('reports remaining time from context', async () => {
    const context = buildLambdaContext({
      remainingTimeOverride: 5000,
    })

    const result = await handler({}, context)

    const body = JSON.parse(result.body)
    expect(body.remainingTime).toBe(5000)
  })
})
```

---

## Mocking External Services

The sls-testing libraries handle event construction and response assertion. For mocking AWS SDK calls within your handler, combine with `aws-sdk-client-mock`:

### AWS SDK v3 Mocking

```typescript
import { mockClient } from 'aws-sdk-client-mock'
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { buildApiGatewayV2Event } from '@sls-testing/core'
import '@sls-testing/jest'
import { handler } from './handler'

const ddbMock = mockClient(DynamoDBDocumentClient)

beforeEach(() => {
  ddbMock.reset()
})

it('saves order to DynamoDB', async () => {
  ddbMock.on(PutCommand).resolves({})

  const event = buildApiGatewayV2Event({
    requestContext: { http: { method: 'POST' } },
    body: JSON.stringify({ product: 'Widget', amount: 29.99 }),
  })

  const result = await handler(event)

  expect(result).toHaveStatusCode(201)
  expect(ddbMock.calls()).toHaveLength(1)
})

it('returns 500 when DynamoDB fails', async () => {
  ddbMock.on(PutCommand).rejects(new Error('Service unavailable'))

  const event = buildApiGatewayV2Event({
    requestContext: { http: { method: 'POST' } },
    body: JSON.stringify({ product: 'Widget' }),
  })

  const result = await handler(event)

  expect(result).toBeServerError()
})
```

### Mock Rule: I/O Boundaries Only

**Mock at the I/O boundary (network, database, filesystem), not internal functions.**

```typescript
// GOOD -- mock the SDK call
ddbMock.on(PutCommand).resolves({})

// BAD -- mock internal business logic
jest.spyOn(orderService, 'createOrder').mockResolvedValue({ id: '123' })
```

Why: Mocking internal functions hides bugs because mocks silently accept any arguments. Let business logic run for real so parameter mismatches, validation errors, and logic bugs are caught.

### Using jest.spyOn for Side Effect Verification

```typescript
const publishSpy = jest.spyOn(snsClient, 'send')

const event = buildSQSEvent({
  records: [{ body: { orderId: 'order-1', notify: true } }],
})

await handler(event)

expect(publishSpy).toHaveBeenCalledTimes(1)
publishSpy.mockRestore()
```

---

## Environment Variables

### Manual Setup (simple)

```typescript
describe('handler with env config', () => {
  beforeAll(() => {
    process.env.ORDERS_TABLE = 'orders-test'
    process.env.REGION = 'us-east-1'
  })

  afterAll(() => {
    delete process.env.ORDERS_TABLE
    delete process.env.REGION
  })

  it('uses table name from env', async () => { ... })
})
```

### Plugin-based Setup (from serverless.yml)

```typescript
import { ServerlessTestingPlugin } from 'serverless-testing-plugin'

const plugin = new ServerlessTestingPlugin(serverless, {})
const fnConfig = plugin.getFunction('processOrder')

beforeAll(() => {
  if (fnConfig.environment) {
    for (const [key, value] of Object.entries(fnConfig.environment)) {
      process.env[key] = value
    }
  }
})

afterAll(() => {
  // Clean up each env var
  if (fnConfig.environment) {
    for (const key of Object.keys(fnConfig.environment)) {
      delete process.env[key]
    }
  }
})
```

---

## Error Path Testing

Always test error paths alongside happy paths:

```typescript
describe('error handling', () => {
  it('returns 400 for missing required fields', async () => {
    const event = buildApiGatewayV2Event({
      requestContext: { http: { method: 'POST' } },
      body: JSON.stringify({}), // missing required fields
    })

    const result = await handler(event)
    expect(result).toBeClientError()
  })

  it('returns 400 for invalid JSON body', async () => {
    const event = buildApiGatewayV2Event({
      requestContext: { http: { method: 'POST' } },
      body: 'not-json',
    })

    const result = await handler(event)
    expect(result).toBeClientError()
  })

  it('returns 400 for missing body', async () => {
    const event = buildApiGatewayV2Event({
      requestContext: { http: { method: 'POST' } },
      // no body
    })

    const result = await handler(event)
    expect(result).toBeClientError()
  })

  it('returns 500 when downstream service fails', async () => {
    ddbMock.on(PutCommand).rejects(new Error('Connection timeout'))

    const event = buildApiGatewayV2Event({
      requestContext: { http: { method: 'POST' } },
      body: JSON.stringify({ product: 'Widget' }),
    })

    const result = await handler(event)
    expect(result).toBeServerError()
  })
})
```

---

## Factory Functions

For complex test data, create reusable factory functions:

```typescript
// test/factories.ts
import { buildApiGatewayV2Event, buildLambdaContext } from '@sls-testing/core'

export function createOrderEvent(overrides: Record<string, unknown> = {}) {
  return buildApiGatewayV2Event({
    requestContext: { http: { method: 'POST' } },
    rawPath: '/orders',
    body: JSON.stringify({
      product: 'Widget',
      amount: 29.99,
      ...overrides,
    }),
  })
}

export function createGetOrderEvent(orderId: string) {
  return buildApiGatewayV2Event({
    requestContext: { http: { method: 'GET' } },
    rawPath: `/orders/${orderId}`,
    pathParameters: { id: orderId },
  })
}

export function createTestContext(functionName = 'test-handler') {
  return buildLambdaContext({
    functionName,
    memoryLimitInMB: '256',
    remainingTimeOverride: 10_000,
  })
}
```

Usage in tests:

```typescript
import { createOrderEvent, createGetOrderEvent } from '../factories'

it('creates an order', async () => {
  const event = createOrderEvent({ product: 'Gadget', amount: 149.99 })
  const result = await handler(event)
  expect(result).toHaveStatusCode(201)
})

it('gets an order', async () => {
  const event = createGetOrderEvent('ord_123')
  const result = await handler(event)
  expect(result).toHaveStatusCode(200)
})
```

---

## Testing Time-Dependent Code

### Fake Timers

```typescript
it('generates correct timestamp', async () => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-01-01T00:00:00Z'))

  const event = buildApiGatewayV2Event({
    requestContext: { http: { method: 'POST' } },
    body: JSON.stringify({ product: 'Widget' }),
  })

  const result = await handler(event)
  const body = JSON.parse(result.body)

  expect(body.createdAt).toBe('2026-01-01T00:00:00.000Z')

  jest.useRealTimers()
})
```

### Timezone Control

```typescript
import { setupServerlessTesting } from '@sls-testing/jest'

const cleanup = setupServerlessTesting({ timezone: 'UTC' })
afterAll(() => cleanup())
```

---

## Testing Partial Batch Failures

SQS Lambda triggers with partial batch failure reporting require careful testing:

```typescript
describe('SQS batch processing', () => {
  it('succeeds for all valid messages', async () => {
    const event = buildSQSEvent({
      records: [
        { body: { orderId: 'o1', amount: 10 } },
        { body: { orderId: 'o2', amount: 20 } },
        { body: { orderId: 'o3', amount: 30 } },
      ],
    })

    const result = await handler(event)
    expect(result).toHaveNoFailedMessages()
  })

  it('reports exactly the failed messages', async () => {
    const event = buildSQSEvent({
      records: [
        { body: { orderId: 'o1', amount: 10 } },   // passes
        { body: { orderId: 'o2', amount: -5 } },    // fails: negative
        { body: { orderId: 'o3', amount: 30 } },    // passes
        { body: { orderId: 'o4', amount: 0 } },     // fails: zero
      ],
    })

    const result = await handler(event)

    expect(result).toHaveFailedMessage(event.Records[1].messageId)
    expect(result).toHaveFailedMessage(event.Records[3].messageId)
    expect(result).not.toHaveFailedMessage(event.Records[0].messageId)
    expect(result).not.toHaveFailedMessage(event.Records[2].messageId)
    expect(result.batchItemFailures).toHaveLength(2)
  })

  it('handles empty batch', async () => {
    const event = buildSQSEvent({ records: [] })
    const result = await handler(event)
    expect(result).toHaveNoFailedMessages()
  })
})
```

---

## Testing DynamoDB Stream Processors

```typescript
describe('DynamoDB Stream Processor', () => {
  it('handles mixed event types in a single batch', async () => {
    const event = buildDynamoDBStreamEvent({
      records: [
        {
          eventName: 'INSERT',
          keys: { id: 'u1' },
          newImage: { id: 'u1', name: 'Alice' },
        },
        {
          eventName: 'MODIFY',
          keys: { id: 'u2' },
          oldImage: { id: 'u2', name: 'Bob' },
          newImage: { id: 'u2', name: 'Robert' },
        },
        {
          eventName: 'REMOVE',
          keys: { id: 'u3' },
          oldImage: { id: 'u3', name: 'Charlie' },
        },
      ],
    })

    const result = await handler(event)

    expect(result).toMatchLambdaResponse({
      body: { inserts: 1, updates: 1, deletes: 1 },
    })
  })
})
```

---

## Jest Configuration

### Recommended jest.config.ts

```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  setupFilesAfterEnv: ['@sls-testing/jest'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}

export default config
```

### Module Name Mapper

If your project uses ESM imports with `.js` extensions, add the module name mapper to strip them:

```json
{
  "moduleNameMapper": {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
}
```

---

## Troubleshooting

### Tests pass locally but fail in CI

**Common causes:**
- Environment variable differences -- use `.env.test` or `setupServerlessTesting()`
- Timezone differences -- set `timezone: 'UTC'` in setup
- Async timing issues -- ensure all promises are awaited

### Jest matchers not found (toHaveStatusCode is not a function)

**Fix:** Ensure matchers are registered before tests run:

```typescript
// Option 1: In jest.config
{ "setupFilesAfterEnv": ["@sls-testing/jest"] }

// Option 2: In each test file
import '@sls-testing/jest'
```

### TypeScript errors on custom matchers

**Fix:** Ensure `@sls-testing/jest` types are included. If using a custom `tsconfig.json` for tests, make sure it includes the package's type declarations. The types extend `jest.Matchers` automatically.

### Event body is undefined in handler

**Fix:** Remember to `JSON.stringify()` the body when building API Gateway events:

```typescript
// Wrong -- body will be [object Object]
const event = buildApiGatewayV2Event({
  body: { name: 'Lucas' },
})

// Correct -- body is a JSON string
const event = buildApiGatewayV2Event({
  body: JSON.stringify({ name: 'Lucas' }),
})
```

Note: SQS and SNS builders auto-serialize body/message objects. API Gateway builders do NOT auto-serialize because the body could be any string format.

### SQS messageId is undefined

**Fix:** Access messageIds from the built event, not from your input:

```typescript
const event = buildSQSEvent({
  records: [{ body: { orderId: 'o1' } }],
})

// Correct -- access from the built event
const messageId = event.Records[0].messageId

// Wrong -- records input doesn't have messageId
// const messageId = records[0].messageId
```
