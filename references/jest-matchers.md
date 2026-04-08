# @sls-testing/jest -- Complete Matchers Reference

## Table of Contents

1. [Setup](#setup)
2. [Status Code Matchers](#status-code-matchers)
3. [Lambda Response Matcher](#lambda-response-matcher)
4. [SQS Batch Matchers](#sqs-batch-matchers)
5. [Side Effects Matcher](#side-effects-matcher)
6. [Setup Helper](#setup-helper)
7. [TypeScript Declarations](#typescript-declarations)

---

## Setup

### Option 1: Jest config (recommended)

Register matchers globally via `setupFilesAfterEnv`:

```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "setupFilesAfterEnv": ["@sls-testing/jest"]
}
```

### Option 2: Per-file import

Import at the top of each test file:

```typescript
import '@sls-testing/jest'
```

Both approaches call `expect.extend(matchers)` to register all custom matchers.

---

## Status Code Matchers

### toHaveStatusCode(expected: number)

Asserts the response has an exact status code.

```typescript
expect(response).toHaveStatusCode(200)
expect(response).toHaveStatusCode(201)
expect(response).toHaveStatusCode(404)

// Works with .not
expect(response).not.toHaveStatusCode(500)
```

**Receives:** Any object with a `statusCode: number` property.
**Passes:** When `received.statusCode === expected`.

### toBeSuccessfulApiResponse()

Asserts the response has a 2xx status code (200-299).

```typescript
expect(response).toBeSuccessfulApiResponse()

// Covers all success codes
// 200 OK, 201 Created, 202 Accepted, 204 No Content, etc.
```

**Passes:** When `200 <= received.statusCode <= 299`.

### toBeClientError()

Asserts the response has a 4xx status code (400-499).

```typescript
expect(response).toBeClientError()

// Covers all client error codes
// 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, etc.
```

**Passes:** When `400 <= received.statusCode <= 499`.

### toBeServerError()

Asserts the response has a 5xx status code (500-599).

```typescript
expect(response).toBeServerError()

// Covers all server error codes
// 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, etc.
```

**Passes:** When `500 <= received.statusCode <= 599`.

---

## Lambda Response Matcher

### toMatchLambdaResponse(expected)

Comprehensive matcher for Lambda API responses. Checks status code, body, and headers in a single assertion.

```typescript
function toMatchLambdaResponse(expected: {
  statusCode?: number
  body?: string | Record<string, unknown>
  headers?: Record<string, string | undefined>
  [key: string]: unknown
}): void
```

**Behavior:**

| Field | How it matches |
|-------|---------------|
| `statusCode` | Exact numeric match |
| `body` (string) | Parses response body as JSON, then uses `expect.objectContaining()` |
| `body` (object) | Parses response body as JSON, then uses `expect.objectContaining()` |
| `headers` | Case-insensitive subset match |

**Supports Jest asymmetric matchers:**

```typescript
expect(response).toMatchLambdaResponse({
  statusCode: 201,
  body: {
    userId: expect.any(String),
    createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}/),
    tags: expect.arrayContaining(['active']),
  },
})
```

**Examples:**

```typescript
// Match status code and body shape
expect(response).toMatchLambdaResponse({
  statusCode: 200,
  body: { message: 'List of users' },
})

// Match only body (no status code check)
expect(response).toMatchLambdaResponse({
  body: { userId: 'usr_123', name: 'Lucas' },
})

// Match with headers
expect(response).toMatchLambdaResponse({
  statusCode: 201,
  body: { product: 'Widget', status: 'pending' },
  headers: { 'content-type': 'application/json' },
})

// Match using asymmetric matchers
expect(response).toMatchLambdaResponse({
  statusCode: 201,
  body: {
    orderId: expect.stringMatching(/^ord_/),
    amount: expect.any(Number),
  },
})

// Works with .not
expect(response).not.toMatchLambdaResponse({
  statusCode: 200,
  body: { error: 'Not found' },
})
```

---

## SQS Batch Matchers

### toHaveNoFailedMessages()

Asserts the SQS batch response has zero failed messages.

```typescript
expect(sqsResponse).toHaveNoFailedMessages()
```

**Receives:** Object with `batchItemFailures: Array<{ itemIdentifier: string }>`.
**Passes:** When `batchItemFailures` is empty or undefined.

**Example:**

```typescript
const event = buildSQSEvent({
  records: [
    { body: { orderId: 'order-1', amount: 99.9 } },
    { body: { orderId: 'order-2', amount: 49.9 } },
  ],
})

const result = await handler(event)

expect(result).toHaveNoFailedMessages()
```

### toHaveFailedMessage(messageId: string)

Asserts the SQS batch response includes a specific failed message ID.

```typescript
expect(sqsResponse).toHaveFailedMessage('msg-id-2')
```

**Receives:** Object with `batchItemFailures: Array<{ itemIdentifier: string }>`.
**Passes:** When `messageId` is found in `batchItemFailures[].itemIdentifier`.

**Example:**

```typescript
const event = buildSQSEvent({
  records: [
    { body: { orderId: 'order-1', amount: 99.9 } },   // valid
    { body: { orderId: 'order-2', amount: 0.5 } },     // will fail
  ],
})

const result = await handler(event)

// Use the auto-generated messageId from the event
expect(result).toHaveFailedMessage(event.Records[1].messageId)

// Works with .not
expect(result).not.toHaveFailedMessage(event.Records[0].messageId)
```

---

## Side Effects Matcher

### toHaveNoSideEffects()

Asserts a Jest mock or spy was never called.

```typescript
expect(mockOrSpy).toHaveNoSideEffects()
```

**Receives:** A `jest.Mock` or `jest.SpyInstance`.
**Passes:** When `received.mock.calls.length === 0`.

**Example:**

```typescript
const sendEmailSpy = jest.spyOn(emailService, 'sendEmail')

const event = buildSQSEvent({
  records: [{ body: { orderId: 'order-1', skipNotification: true } }],
})

await handler(event)

// Verify no email was sent
expect(sendEmailSpy).toHaveNoSideEffects()

sendEmailSpy.mockRestore()
```

**Use cases:**
- Verify no side effects during dry-run/preview operations
- Confirm conditional logic skips external calls
- Assert idempotency (re-processing doesn't trigger duplicate actions)

---

## Setup Helper

```typescript
import { setupServerlessTesting } from '@sls-testing/jest'

function setupServerlessTesting(options?: SetupOptions): () => void
```

**Options:**

```typescript
interface SetupOptions {
  timezone?: string       // Sets process.env.TZ (e.g., 'UTC')
  suppressLogs?: boolean  // Replaces console.log/warn with jest.fn()
}
```

**Returns:** A cleanup function that restores original values.

**Example:**

```typescript
import { setupServerlessTesting } from '@sls-testing/jest'

describe('Order Processing', () => {
  const cleanup = setupServerlessTesting({
    timezone: 'UTC',
    suppressLogs: true,
  })

  afterAll(() => cleanup())

  it('processes order', async () => {
    // Tests run with UTC timezone and suppressed console output
  })
})
```

**What it does:**
1. Registers all custom matchers via `expect.extend()`
2. If `timezone` is set: saves original `process.env.TZ`, sets new value
3. If `suppressLogs` is true: replaces `console.log` and `console.warn` with `jest.fn()`
4. Returns cleanup function that restores all originals

---

## TypeScript Declarations

When using TypeScript, the matchers are automatically typed via the module's `jest.d.ts` declarations:

```typescript
interface CustomMatchers<R = unknown> {
  toHaveStatusCode(expected: number): R
  toBeSuccessfulApiResponse(): R
  toBeClientError(): R
  toBeServerError(): R
  toMatchLambdaResponse(expected: {
    statusCode?: number
    body?: string | Record<string, unknown>
    headers?: Record<string, string | undefined>
    [key: string]: unknown
  }): R
  toHaveNoFailedMessages(): R
  toHaveFailedMessage(messageId: string): R
  toHaveNoSideEffects(): R
}
```

These are declared on `jest.Matchers`, `jest.Expect`, and `jest.InverseAsymmetricMatchers` so they work everywhere:

```typescript
// On expect()
expect(response).toHaveStatusCode(200)

// With .not
expect(response).not.toBeServerError()

// TypeScript autocompletion works in IDEs
```
