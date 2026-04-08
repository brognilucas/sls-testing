# @sls-testing/core -- Complete API Reference

## Table of Contents

1. [Event Builders](#event-builders)
2. [Lambda Context Mock](#lambda-context-mock)
3. [Response Asserters](#response-asserters)
4. [Utility Functions](#utility-functions)
5. [Types](#types)
6. [Constants](#constants)

---

## Event Builders

All builders follow the same contract:
- Accept an optional `DeepPartial` override object
- Return a fully-typed, complete AWS event with sensible defaults
- Use deep merge -- nested overrides don't clobber sibling fields
- Auto-serialize body/message payloads when the value is not already a string

### buildApiGatewayV2Event

Builds an API Gateway HTTP API (v2) event.

```typescript
import { buildApiGatewayV2Event } from '@sls-testing/core'

function buildApiGatewayV2Event(
  overrides?: ApiGatewayV2Overrides
): APIGatewayProxyEventV2
```

**Override type:**

```typescript
interface ApiGatewayV2Overrides extends DeepPartial<APIGatewayProxyEventV2> {
  /** Convenience shorthand -- mapped to requestContext.http.method */
  method?: string
  /** Convenience shorthand -- mapped to rawPath and requestContext.http.path */
  path?: string
}
```

**Defaults:**

| Field | Default |
|-------|---------|
| `version` | `'2.0'` |
| `routeKey` | `'$default'` |
| `rawPath` | `'/'` |
| `rawQueryString` | `''` |
| `headers` | `{ 'content-type': 'application/json' }` |
| `isBase64Encoded` | `false` |
| `requestContext.accountId` | `'123456789012'` |
| `requestContext.apiId` | `'test-api-id'` |
| `requestContext.domainName` | `'test-api-id.execute-api.us-east-1.amazonaws.com'` |
| `requestContext.domainPrefix` | `'test-api-id'` |
| `requestContext.http.method` | `'GET'` |
| `requestContext.http.path` | `'/'` |
| `requestContext.http.protocol` | `'HTTP/1.1'` |
| `requestContext.http.sourceIp` | `'127.0.0.1'` |
| `requestContext.http.userAgent` | `'Custom User Agent String'` |
| `requestContext.requestId` | Auto-generated UUID |
| `requestContext.routeKey` | `'$default'` |
| `requestContext.stage` | `'$default'` |
| `requestContext.time` | ISO timestamp |
| `requestContext.timeEpoch` | `Date.now()` |

**Examples:**

```typescript
// Minimal GET request
const event = buildApiGatewayV2Event()

// POST with body
const event = buildApiGatewayV2Event({
  requestContext: { http: { method: 'POST' } },
  rawPath: '/users',
  body: JSON.stringify({ name: 'Lucas' }),
})

// Using convenience shorthands
const event = buildApiGatewayV2Event({
  method: 'POST',
  path: '/users',
  body: JSON.stringify({ name: 'Lucas' }),
})

// With path parameters and query strings
const event = buildApiGatewayV2Event({
  requestContext: { http: { method: 'GET' } },
  rawPath: '/users/42',
  pathParameters: { id: '42' },
  queryStringParameters: { include: 'orders', limit: '10' },
})

// With custom headers
const event = buildApiGatewayV2Event({
  headers: {
    'content-type': 'application/json',
    authorization: 'Bearer token123',
  },
})
```

**Alias:** `buildApiGatewayEvent` is an alias for `buildApiGatewayV2Event`.

---

### buildApiGatewayV1Event

Builds an API Gateway REST API (v1) event.

```typescript
import { buildApiGatewayV1Event } from '@sls-testing/core'

function buildApiGatewayV1Event(
  overrides?: DeepPartial<APIGatewayProxyEvent>
): APIGatewayProxyEvent
```

**Defaults:**

| Field | Default |
|-------|---------|
| `body` | `null` |
| `headers` | `{ 'Content-Type': 'application/json' }` |
| `multiValueHeaders` | `{ 'Content-Type': ['application/json'] }` |
| `httpMethod` | `'GET'` |
| `isBase64Encoded` | `false` |
| `path` | `'/'` |
| `pathParameters` | `null` |
| `queryStringParameters` | `null` |
| `multiValueQueryStringParameters` | `null` |
| `stageVariables` | `null` |
| `resource` | `'/{proxy+}'` |
| `requestContext.accountId` | `'123456789012'` |
| `requestContext.apiId` | `'test-api-id'` |
| `requestContext.authorizer` | `null` |
| `requestContext.protocol` | `'HTTP/1.1'` |
| `requestContext.httpMethod` | `'GET'` |
| `requestContext.identity.sourceIp` | `'127.0.0.1'` |
| `requestContext.identity.userAgent` | `'Custom User Agent String'` |
| `requestContext.path` | `'/'` |
| `requestContext.stage` | `'test'` |
| `requestContext.requestId` | Auto-generated UUID |
| `requestContext.requestTimeEpoch` | `Date.now()` |
| `requestContext.resourceId` | `'test-resource-id'` |
| `requestContext.resourcePath` | `'/{proxy+}'` |

**Examples:**

```typescript
// GET with path parameters
const event = buildApiGatewayV1Event({
  httpMethod: 'GET',
  path: '/orders/ord_123',
  pathParameters: { id: 'ord_123' },
})

// POST with body
const event = buildApiGatewayV1Event({
  httpMethod: 'POST',
  path: '/orders',
  body: JSON.stringify({ product: 'Widget', amount: 29.99 }),
})

// With authorizer context
const event = buildApiGatewayV1Event({
  requestContext: {
    authorizer: { principalId: 'user-123', scope: 'admin' },
  },
})
```

---

### buildSQSEvent

Builds an SQS event with one or more records.

```typescript
import { buildSQSEvent } from '@sls-testing/core'

function buildSQSEvent(
  overrides?: SQSEventOverrides
): SQSEvent
```

**Override type:**

```typescript
interface SimplifiedSQSRecord {
  body?: unknown        // Auto-serialized to JSON string
  [key: string]: unknown
}

interface SQSEventOverrides extends DeepPartial<SQSEvent> {
  records?: SimplifiedSQSRecord[]
}
```

**Record defaults:**

| Field | Default |
|-------|---------|
| `messageId` | Auto-generated UUID |
| `receiptHandle` | `'receipt-handle-{messageId}'` |
| `body` | `'{}'` |
| `attributes.ApproximateReceiveCount` | `'1'` |
| `attributes.SentTimestamp` | `Date.now().toString()` |
| `attributes.SenderId` | `'{DEFAULT_ACCOUNT_ID}:test-sender'` |
| `attributes.ApproximateFirstReceiveTimestamp` | `Date.now().toString()` |
| `messageAttributes` | `{}` |
| `md5OfBody` | `'md5-{messageId}'` |
| `eventSource` | `'aws:sqs'` |
| `eventSourceARN` | `'arn:aws:sqs:{region}:{account}:test-queue'` |
| `awsRegion` | `'us-east-1'` |

**Examples:**

```typescript
// Single record with object body (auto-serialized)
const event = buildSQSEvent({
  records: [{ body: { orderId: 'abc-123', amount: 99.9 } }],
})

// Multiple records
const event = buildSQSEvent({
  records: [
    { body: { orderId: 'order-1', amount: 99.9 } },
    { body: { orderId: 'order-2', amount: 49.9 } },
  ],
})

// Access generated messageIds for assertions
const firstId = event.Records[0].messageId
const secondId = event.Records[1].messageId

// Empty event (default single record)
const event = buildSQSEvent()
```

---

### buildS3Event

Builds an S3 event notification.

```typescript
import { buildS3Event } from '@sls-testing/core'

function buildS3Event(
  overrides?: S3EventOverrides
): S3Event
```

**Override type:**

```typescript
interface S3EventOverrides extends DeepPartial<S3Event> {
  bucket?: string       // Shorthand for s3.bucket.name
  key?: string          // Shorthand for s3.object.key
  eventName?: string    // Shorthand for eventName, defaults to 'ObjectCreated:Put'
}
```

**Defaults:**

| Field | Default |
|-------|---------|
| `Records[0].eventVersion` | `'2.1'` |
| `Records[0].eventSource` | `'aws:s3'` |
| `Records[0].awsRegion` | `'us-east-1'` |
| `Records[0].eventTime` | ISO timestamp |
| `Records[0].eventName` | `'ObjectCreated:Put'` |
| `Records[0].s3.s3SchemaVersion` | `'1.0'` |
| `Records[0].s3.bucket.name` | `'test-bucket'` |
| `Records[0].s3.bucket.arn` | `'arn:aws:s3:::test-bucket'` |
| `Records[0].s3.object.key` | `'test-key'` |
| `Records[0].s3.object.size` | `1024` |
| `Records[0].s3.object.eTag` | `'test-etag'` |

**Examples:**

```typescript
// Using convenience shorthands
const event = buildS3Event({
  bucket: 'my-uploads',
  key: 'images/photo.png',
  eventName: 'ObjectCreated:Put',
})

// Object deletion
const event = buildS3Event({
  bucket: 'my-bucket',
  key: 'temp/file.csv',
  eventName: 'ObjectRemoved:Delete',
})

// Full override
const event = buildS3Event({
  Records: [{
    s3: {
      bucket: { name: 'custom-bucket' },
      object: { key: 'custom/key.json', size: 4096 },
    },
  }],
})
```

---

### buildEventBridgeEvent

Builds an EventBridge event with a generic detail type.

```typescript
import { buildEventBridgeEvent } from '@sls-testing/core'

function buildEventBridgeEvent<TDetail = Record<string, unknown>>(
  overrides?: EventBridgeOverrides<TDetail>
): EventBridgeEvent<string, TDetail>
```

**Override type:**

```typescript
type EventBridgeOverrides<TDetail> = DeepPartial<EventBridgeEvent<string, TDetail>> & {
  'detail-type'?: string    // Convenience for the hyphenated field
  'replay-name'?: string    // Convenience for the hyphenated field
}
```

**Defaults:**

| Field | Default |
|-------|---------|
| `id` | Auto-generated UUID |
| `version` | `'0'` |
| `account` | `'123456789012'` |
| `time` | ISO timestamp |
| `region` | `'us-east-1'` |
| `resources` | `[]` |
| `source` | `'test.source'` |
| `detail-type` | `'TestDetailType'` |
| `detail` | `{}` |

**Examples:**

```typescript
// Custom event
const event = buildEventBridgeEvent({
  source: 'app.orders',
  'detail-type': 'OrderPlaced',
  detail: { orderId: 'abc-123', amount: 99.9 },
})

// Typed detail
interface OrderDetail { orderId: string; amount: number }
const event = buildEventBridgeEvent<OrderDetail>({
  source: 'app.orders',
  'detail-type': 'OrderPlaced',
  detail: { orderId: 'abc-123', amount: 99.9 },
})

// AWS service event
const event = buildEventBridgeEvent({
  source: 'aws.ec2',
  'detail-type': 'EC2 Instance State-change Notification',
  detail: { 'instance-id': 'i-1234567890abcdef0', state: 'stopped' },
})
```

---

### buildSNSEvent

Builds an SNS event with one or more records.

```typescript
import { buildSNSEvent } from '@sls-testing/core'

function buildSNSEvent(
  overrides?: SNSEventOverrides
): SNSEvent
```

**Override type:**

```typescript
interface SimplifiedSNSRecord {
  message?: unknown      // Auto-serialized to JSON string
  topicArn?: string
  [key: string]: unknown
}

interface SNSEventOverrides extends DeepPartial<SNSEvent> {
  records?: SimplifiedSNSRecord[]
}
```

**Record defaults:**

| Field | Default |
|-------|---------|
| `EventVersion` | `'1.0'` |
| `EventSource` | `'aws:sns'` |
| `Sns.MessageId` | Auto-generated UUID |
| `Sns.Message` | `'{}'` |
| `Sns.Type` | `'Notification'` |
| `Sns.TopicArn` | `'arn:aws:sns:{region}:{account}:test-topic'` |
| `Sns.Timestamp` | ISO timestamp |
| `Sns.SignatureVersion` | `'1'` |
| `Sns.MessageAttributes` | `{}` |

**Examples:**

```typescript
// Single notification
const event = buildSNSEvent({
  records: [{ message: { action: 'notify', userId: 'u_1' } }],
})

// With custom topic
const event = buildSNSEvent({
  records: [{
    message: { event: 'user.created' },
    topicArn: 'arn:aws:sns:us-east-1:123456789012:user-events',
  }],
})
```

---

### buildDynamoDBStreamEvent

Builds a DynamoDB Streams event with auto-marshalling.

```typescript
import { buildDynamoDBStreamEvent, marshall } from '@sls-testing/core'

function buildDynamoDBStreamEvent(
  overrides?: DynamoDBStreamEventOverrides
): DynamoDBStreamEvent

function marshall(value: unknown): AttributeValue
```

**Override type:**

```typescript
interface SimplifiedDynamoDBRecord {
  eventName?: 'INSERT' | 'MODIFY' | 'REMOVE'
  keys?: Record<string, unknown>       // Auto-marshalled
  newImage?: Record<string, unknown>    // Auto-marshalled
  oldImage?: Record<string, unknown>    // Auto-marshalled
  [key: string]: unknown
}

interface DynamoDBStreamEventOverrides extends DeepPartial<DynamoDBStreamEvent> {
  records?: SimplifiedDynamoDBRecord[]
}
```

**marshall() conversion rules:**

| JavaScript Value | DynamoDB AttributeValue |
|-----------------|------------------------|
| `null` / `undefined` | `{ NULL: true }` |
| `string` | `{ S: value }` |
| `number` | `{ N: value.toString() }` |
| `boolean` | `{ BOOL: value }` |
| `Array` | `{ L: [...marshalled items] }` |
| `Object` | `{ M: {...marshalled entries} }` |
| Other | `{ S: String(value) }` |

**Record defaults:**

| Field | Default |
|-------|---------|
| `awsRegion` | `'us-east-1'` |
| `dynamodb.ApproximateCreationDateTime` | `Math.floor(Date.now() / 1000)` |
| `dynamodb.Keys` | `{}` |
| `dynamodb.SequenceNumber` | `'111'` |
| `dynamodb.SizeBytes` | `26` |
| `dynamodb.StreamViewType` | Auto-derived or `'NEW_AND_OLD_IMAGES'` |
| `eventID` | Auto-generated UUID |
| `eventName` | `'INSERT'` |
| `eventSource` | `'aws:dynamodb'` |
| `eventVersion` | `'1.1'` |

**StreamViewType auto-derivation:**
- Both newImage and oldImage provided: `'NEW_AND_OLD_IMAGES'`
- Only newImage: `'NEW_IMAGE'`
- Only oldImage: `'OLD_IMAGE'`
- Neither: `'KEYS_ONLY'`

**Examples:**

```typescript
// INSERT event
const event = buildDynamoDBStreamEvent({
  records: [{
    eventName: 'INSERT',
    keys: { id: 'user-1' },
    newImage: { id: 'user-1', name: 'Lucas', age: 30 },
  }],
})

// MODIFY event
const event = buildDynamoDBStreamEvent({
  records: [{
    eventName: 'MODIFY',
    keys: { id: 'user-1' },
    oldImage: { id: 'user-1', name: 'Lucas', age: 30 },
    newImage: { id: 'user-1', name: 'Lucas', age: 31 },
  }],
})

// REMOVE event
const event = buildDynamoDBStreamEvent({
  records: [{
    eventName: 'REMOVE',
    keys: { id: 'user-1' },
    oldImage: { id: 'user-1', name: 'Lucas' },
  }],
})

// Use marshall() directly for custom AttributeValue construction
import { marshall } from '@sls-testing/core'
const attr = marshall({ name: 'Lucas', tags: ['admin', 'active'] })
// { M: { name: { S: 'Lucas' }, tags: { L: [{ S: 'admin' }, { S: 'active' }] } } }
```

---

## Lambda Context Mock

```typescript
import { buildLambdaContext } from '@sls-testing/core'

function buildLambdaContext(
  overrides?: Partial<LambdaContextOptions>
): Context
```

**Options:**

```typescript
interface LambdaContextOptions {
  functionName: string
  functionVersion: string
  memoryLimitInMB: string
  awsRequestId: string
  logGroupName: string
  logStreamName: string
  invokedFunctionArn: string
  callbackWaitsForEmptyEventLoop: boolean
  remainingTimeOverride: number   // milliseconds
}
```

**Defaults:**

| Field | Default |
|-------|---------|
| `functionName` | `'test-function'` |
| `functionVersion` | `'$LATEST'` |
| `memoryLimitInMB` | `'128'` |
| `awsRequestId` | Auto-generated UUID |
| `logGroupName` | `'/aws/lambda/{functionName}'` |
| `logStreamName` | `'{date}/[{functionVersion}]{awsRequestId}'` |
| `invokedFunctionArn` | Auto-generated ARN |
| `callbackWaitsForEmptyEventLoop` | `true` |
| `remainingTimeOverride` | `30000` (30 seconds) |

**Returned Context object methods:**

| Method | Behavior |
|--------|----------|
| `getRemainingTimeInMillis()` | Returns `remainingTimeOverride` value |
| `done(error?, result?)` | No-op |
| `fail(error)` | No-op |
| `succeed(result)` | No-op |

**Examples:**

```typescript
// Default context
const context = buildLambdaContext()
context.functionName           // 'test-function'
context.getRemainingTimeInMillis() // 30000

// Custom context
const context = buildLambdaContext({
  functionName: 'my-service-dev-processOrder',
  memoryLimitInMB: '512',
  remainingTimeOverride: 3000,
})

// Context from serverless-testing-plugin metadata
const fnConfig = plugin.getFunction('processOrder')
const context = buildLambdaContext({
  functionName: fnConfig.name,
  memoryLimitInMB: String(fnConfig.memorySize),
  remainingTimeOverride: (fnConfig.timeout ?? 30) * 1000,
})
```

---

## Response Asserters

Framework-agnostic assertion functions that throw on mismatch. Use these directly or prefer the Jest matchers from `@sls-testing/jest`.

### assertApiResponse

```typescript
import { assertApiResponse } from '@sls-testing/core'

function assertApiResponse(
  response: ApiResponse,
  expectations: ApiResponseExpectations
): void
```

**Types:**

```typescript
interface ApiResponse {
  statusCode: number
  body?: string
  headers?: Record<string, string | undefined>
  [key: string]: unknown
}

interface ApiResponseExpectations {
  statusCode?: number
  bodyContains?: Record<string, unknown> | string
  headers?: Record<string, string>
}
```

**Behavior:**
- `statusCode`: Exact numeric match
- `bodyContains`: If object, deep partial match against parsed JSON body. If string, substring match.
- `headers`: Subset match with case-insensitive header name comparison

### assertSQSBatchResponse

```typescript
import { assertSQSBatchResponse } from '@sls-testing/core'

function assertSQSBatchResponse(
  response: SQSBatchResponse,
  expectations: SQSBatchExpectations
): void
```

**Types:**

```typescript
interface SQSBatchResponse {
  batchItemFailures?: Array<{ itemIdentifier: string }>
}

interface SQSBatchExpectations {
  failedMessageIds?: string[]
}
```

**Behavior:**
- `failedMessageIds`: Exact set match (order-agnostic) against `batchItemFailures[].itemIdentifier`

### assertLambdaError

```typescript
import { assertLambdaError } from '@sls-testing/core'

function assertLambdaError(
  error: unknown,
  expectations: LambdaErrorExpectations
): void
```

**Types:**

```typescript
interface LambdaErrorExpectations {
  errorType?: string
  messagePattern?: string | RegExp
  statusCode?: number
}
```

**Behavior:**
- `errorType`: Exact match on `error.name` (for Error instances) or `error.errorType`
- `messagePattern`: Substring include (string) or regex match (RegExp) against `error.message`
- `statusCode`: Exact numeric match on `error.statusCode`

---

## Utility Functions

### deepMerge

```typescript
import { deepMerge } from '@sls-testing/core'

function deepMerge<T>(
  target: T,
  source: Partial<T> | Record<string, unknown>
): T
```

Recursively merges source into target:
- Preserves target fields not present in source
- Replaces arrays entirely (no concatenation)
- Skips `undefined` values in source
- `null` in source replaces target field with `null`
- Recursively merges plain objects

### deepPartialMatch

```typescript
import { deepPartialMatch } from '@sls-testing/core'

function deepPartialMatch(
  actual: unknown,
  expected: unknown,
  path?: string
): MatchResult
```

**Return type:**

```typescript
interface MatchResult {
  pass: boolean
  diff?: string
}
```

Recursively checks that `actual` contains all fields in `expected`:
- Primitives: exact equality
- Arrays: exact length and element-wise matching
- Objects: every key in `expected` must exist in `actual` with a matching value

### Generators

```typescript
import {
  generateUUID,
  generateTimestamp,
  generateRequestId,
  generateArn,
} from '@sls-testing/core'

function generateUUID(): string          // v4 UUID
function generateTimestamp(): string     // ISO 8601 string
function generateRequestId(): string    // v4 UUID
function generateArn(
  service: string,
  resource: string,
  region?: string,      // default: 'us-east-1'
  accountId?: string    // default: '123456789012'
): string               // 'arn:aws:{service}:{region}:{accountId}:function:{resource}'
```

---

## Types

```typescript
import type { DeepPartial } from '@sls-testing/core'

type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends Date | RegExp | Buffer
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T
```

---

## Constants

```typescript
import { DEFAULT_REGION, DEFAULT_ACCOUNT_ID } from '@sls-testing/core'

const DEFAULT_REGION = 'us-east-1'
const DEFAULT_ACCOUNT_ID = '123456789012'
```
