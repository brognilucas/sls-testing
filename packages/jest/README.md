# @sls-testing/jest

Custom Jest matchers for testing AWS Lambda functions.

## Install

```bash
npm install @sls-testing/core @sls-testing/jest --save-dev
```

## Setup

Add to your Jest config:

```json
{
  "setupFilesAfterEnv": ["@sls-testing/jest"]
}
```

Or import in your test file:

```typescript
import '@sls-testing/jest'
```

## Matchers

### Status Code

```typescript
expect(response).toHaveStatusCode(200)
expect(response).toBeSuccessfulApiResponse() // 2xx
expect(response).toBeClientError()           // 4xx
expect(response).toBeServerError()           // 5xx
```

### Lambda Response

```typescript
expect(response).toMatchLambdaResponse({
  statusCode: 201,
  body: { userId: expect.any(String) }, // asymmetric matchers work
  headers: { 'content-type': 'application/json' },
})
```

### SQS Batch

```typescript
expect(sqsResponse).toHaveNoFailedMessages()
expect(sqsResponse).toHaveFailedMessage('msg-id-2')
```

### Side Effects

```typescript
const spy = jest.spyOn(service, 'sendEmail')
await handler(event, context)
expect(spy).toHaveNoSideEffects()
```

## Setup Helper

```typescript
import { setupServerlessTesting } from '@sls-testing/jest'

const cleanup = setupServerlessTesting({
  timezone: 'UTC',
  suppressLogs: true,
})

afterAll(() => cleanup())
```

## License

MIT
