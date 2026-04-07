# serverless-testing-plugin

Serverless Framework plugin that exposes function metadata and environment loading for tests. Use it with `@sls-testing/core` and `@sls-testing/jest` to test Lambda handlers with the same configuration they receive in production.

## Install

```bash
npm install serverless-testing-plugin @sls-testing/core @sls-testing/jest --save-dev
```

## Configuration

Add the plugin to your `serverless.yml`:

```yaml
plugins:
  - serverless-testing-plugin

custom:
  serverlessTesting:
    envFile: .env.test     # default
    autoLoadEnv: true      # default
```

## API

### getFunction(name)

Returns metadata for a function defined in `serverless.yml`.

```typescript
import { ServerlessTestingPlugin } from 'serverless-testing-plugin'

const plugin = new ServerlessTestingPlugin(serverless, options)
const fn = plugin.getFunction('processOrder')
```

The returned object contains:

| Field | Type | Description |
|-------|------|-------------|
| `handler` | `string` | Handler path (e.g. `src/handlers/order.handler`) |
| `name` | `string` | Resolved function name (e.g. `my-service-dev-processOrder`) |
| `memorySize` | `number` | Memory allocation in MB |
| `timeout` | `number` | Timeout in seconds |
| `runtime` | `string` | Runtime (e.g. `nodejs20.x`) |
| `environment` | `Record<string, string>` | Environment variables from serverless.yml |
| `events` | `unknown[]` | Event source triggers |

Throws a descriptive error if the function name is not found, listing available functions.

### getAllFunctions()

Returns metadata for all functions in the service.

```typescript
const all = plugin.getAllFunctions()
// { processOrder: { handler, name, ... }, getOrder: { handler, name, ... } }
```

### sls test

Loads `.env.test`, generates `sls-testing.config.json` with resolved function metadata, then runs your test suite.

```bash
sls test
```

## Usage in Tests

The plugin bridges `serverless.yml` and your test setup. Instead of hardcoding function names, memory limits, and environment variables in tests, read them from the same source of truth your Lambda functions use.

### Step 1: Create the plugin instance

Point the plugin at your `serverless.yml` configuration. In a test file, this is typically a mock matching your real config:

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
}

const plugin = new ServerlessTestingPlugin(serverless as any, {})
```

### Step 2: Load function metadata and environment

Use `getFunction()` to read the function's configuration and set environment variables before tests run:

```typescript
const fnConfig = plugin.getFunction('processOrder')

beforeAll(() => {
  // Load the same env vars the function receives in production
  if (fnConfig.environment) {
    for (const [key, value] of Object.entries(fnConfig.environment)) {
      process.env[key] = value
    }
  }
})

afterAll(() => {
  delete process.env.ORDERS_TABLE
  delete process.env.NOTIFICATION_TOPIC
})
```

### Step 3: Build context from real function settings

Configure `buildLambdaContext()` with the function's actual name, memory limit, and timeout:

```typescript
const context = buildLambdaContext({
  functionName: fnConfig.name,
  memoryLimitInMB: String(fnConfig.memorySize),
  remainingTimeOverride: (fnConfig.timeout ?? 30) * 1000,
})
```

### Step 4: Build events and assert with Jest matchers

```typescript
import { handler } from './process-order'

it('creates an order', async () => {
  const event = buildApiGatewayV1Event({
    httpMethod: 'POST',
    path: '/orders',
    body: JSON.stringify({ product: 'Widget', amount: 29.99 }),
  })

  const result = await handler(event)

  expect(result).toHaveStatusCode(201)
  expect(result).toBeSuccessfulApiResponse()
  expect(result).toMatchLambdaResponse({
    body: { product: 'Widget', status: 'pending' },
  })
})
```

### Complete example

See [`examples/serverless-plugin/`](../../examples/serverless-plugin/) for a full working project with:

- `serverless.yml` defining two functions (`processOrder` and `getOrder`)
- `.env.test` with test environment variables
- Test files showing the complete plugin workflow
- 7 tests demonstrating metadata loading, context building, and assertion

## License

MIT
