# @sls-testing

Typed, composable testing utilities for AWS Lambda.

Built for Jest (Vitest adapter planned for v2). Designed to complement the *Testing Serverless Applications* ebook.

## Packages

| Package | Description |
|---------|-------------|
| [`@sls-testing/core`](./packages/core) | Event builders, Lambda context mock, response asserters |
| [`@sls-testing/jest`](./packages/jest) | Custom Jest matchers for Lambda responses |
| [`serverless-testing-plugin`](./packages/serverless-plugin) | Serverless Framework plugin for test metadata |

## Quick Start

```bash
npm install @sls-testing/core @sls-testing/jest --save-dev
```

### Build events

```typescript
import {
  buildApiGatewayEvent,
  buildSQSEvent,
  buildLambdaContext,
} from '@sls-testing/core'

const event = buildApiGatewayEvent({
  requestContext: { http: { method: 'POST' } },
  body: JSON.stringify({ name: 'Lucas' }),
})

const sqsEvent = buildSQSEvent({
  records: [
    { body: { orderId: 'abc-123', amount: 99.9 } },
  ],
})

const context = buildLambdaContext({
  functionName: 'my-service-dev-processOrder',
  remainingTimeOverride: 5000,
})
```

### Assert with Jest matchers

```typescript
import '@sls-testing/jest'

const result = await handler(event, context)

expect(result).toHaveStatusCode(200)
expect(result).toBeSuccessfulApiResponse()
expect(result).toMatchLambdaResponse({
  body: { userId: expect.any(String) },
})
```

## Monorepo Structure

```
@sls-testing/
  packages/
    core/               @sls-testing/core
    jest/               @sls-testing/jest
    serverless-plugin/  serverless-testing-plugin
  examples/
    basic-lambda/
    api-gateway/
    sqs-consumer/
```

## Supported Event Types

- API Gateway REST (v1) and HTTP API (v2)
- SQS (single and batch)
- S3 (ObjectCreated, ObjectRemoved)
- EventBridge
- SNS
- DynamoDB Streams

## Development

```bash
pnpm install
pnpm turbo run build
pnpm turbo run test
```

## License

MIT
