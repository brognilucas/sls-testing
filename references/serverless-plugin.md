# serverless-testing-plugin -- Complete Reference

## Table of Contents

1. [Overview](#overview)
2. [Installation and Configuration](#installation-and-configuration)
3. [Plugin API](#plugin-api)
4. [Environment Loader](#environment-loader)
5. [Config Generator](#config-generator)
6. [Complete Test Workflow](#complete-test-workflow)

---

## Overview

The serverless-testing-plugin bridges your `serverless.yml` configuration into your test suite. Instead of hardcoding function names, memory limits, timeouts, and environment variables in tests, read them from the same source of truth your Lambda functions use in production.

**What it provides:**
- `getFunction(name)` -- extract metadata for any function in serverless.yml
- `getAllFunctions()` -- extract metadata for all functions
- `.env.test` auto-loading -- load test environment variables before tests run
- `sls-testing.config.json` generation -- resolved function metadata for CI/local use
- `sls test` command -- runs your test suite with serverless context

---

## Installation and Configuration

### Install

```bash
npm install --save-dev serverless-testing-plugin @sls-testing/core @sls-testing/jest
```

### Configure serverless.yml

```yaml
plugins:
  - serverless-testing-plugin

custom:
  serverlessTesting:
    envFile: .env.test     # path to env file (default: '.env.test')
    autoLoadEnv: true      # load env file on setup (default: true)
```

### Create .env.test

```bash
# .env.test
ORDERS_TABLE=orders-test
NOTIFICATION_TOPIC=arn:aws:sns:us-east-1:123456789012:order-notifications-test
NODE_ENV=test
```

---

## Plugin API

### ServerlessTestingPlugin

```typescript
import { ServerlessTestingPlugin } from 'serverless-testing-plugin'

class ServerlessTestingPlugin {
  constructor(serverless: ServerlessInstance, options: Record<string, unknown>)
  getFunction(name: string): FunctionMetadata
  getAllFunctions(): Record<string, FunctionMetadata>
}
```

### Constructor

Creates a plugin instance from a Serverless Framework service configuration.

**In tests**, you typically create a mock serverless object matching your real config:

```typescript
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
      getOrder: {
        handler: 'src/handlers/get-order.handler',
        memorySize: 256,
        timeout: 10,
        environment: { ORDERS_TABLE: 'orders-dev' },
        events: [{ http: { path: '/orders/{id}', method: 'get' } }],
      },
    },
    provider: { stage: 'dev', region: 'us-east-1' },
  },
  config: { servicePath: __dirname },
} as any

const plugin = new ServerlessTestingPlugin(serverless, {})
```

### getFunction(name: string): FunctionMetadata

Returns metadata for a specific function defined in serverless.yml.

**Throws** a descriptive error if the function name is not found, listing all available function names.

```typescript
const fnConfig = plugin.getFunction('processOrder')
```

**Return type:**

```typescript
interface FunctionMetadata {
  handler: string                        // e.g., 'src/handlers/process-order.handler'
  name: string                           // Resolved name, e.g., 'order-service-dev-processOrder'
  memorySize?: number                    // e.g., 512
  timeout?: number                       // e.g., 30 (seconds)
  runtime?: string                       // e.g., 'nodejs20.x'
  environment?: Record<string, string>   // e.g., { ORDERS_TABLE: 'orders-dev' }
  events?: unknown[]                     // e.g., [{ http: { path: '/orders', method: 'post' } }]
}
```

### getAllFunctions(): Record<string, FunctionMetadata>

Returns metadata for all functions in the service.

```typescript
const all = plugin.getAllFunctions()
// {
//   processOrder: { handler: '...', name: '...', memorySize: 512, ... },
//   getOrder: { handler: '...', name: '...', memorySize: 256, ... },
// }

expect(Object.keys(all)).toEqual(['processOrder', 'getOrder'])
```

---

## Environment Loader

```typescript
import { loadEnvFile } from 'serverless-testing-plugin'

function loadEnvFile(filePath: string, cwd: string): void
```

Loads a `.env` file into `process.env`.

**Behavior:**
- Reads file at `path.resolve(cwd, filePath)`
- Parses `KEY=VALUE` format (one per line)
- Skips empty lines and comment lines (starting with `#`)
- Removes surrounding quotes from values (`"value"` or `'value'` becomes `value`)
- Sets `process.env[key] = value` for each entry
- Logs a warning (does not throw) if the file is not found

**Example .env.test:**

```bash
# Database configuration
ORDERS_TABLE=orders-test
USERS_TABLE=users-test

# AWS resources
NOTIFICATION_TOPIC=arn:aws:sns:us-east-1:123456789012:test
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/test-queue

# Feature flags
ENABLE_NOTIFICATIONS="true"
LOG_LEVEL='debug'
```

---

## Config Generator

```typescript
import { generateConfig } from 'serverless-testing-plugin'

function generateConfig(config: TestingConfig, outputDir: string): string
```

Generates a `sls-testing.config.json` file with resolved function metadata.

**Types:**

```typescript
interface TestingConfig {
  service: string
  stage: string
  region: string
  functions: Record<string, FunctionMetadata>
}
```

**Returns:** The output file path.

**Generated file example:**

```json
{
  "service": "order-service",
  "stage": "dev",
  "region": "us-east-1",
  "functions": {
    "processOrder": {
      "handler": "src/handlers/process-order.handler",
      "name": "order-service-dev-processOrder",
      "memorySize": 512,
      "timeout": 30,
      "runtime": "nodejs20.x",
      "environment": {
        "ORDERS_TABLE": "orders-dev"
      },
      "events": [{ "http": { "path": "/orders", "method": "post" } }]
    }
  }
}
```

---

## Complete Test Workflow

### Step 1: Create the plugin instance

```typescript
import { ServerlessTestingPlugin } from 'serverless-testing-plugin'
import { buildApiGatewayV1Event, buildLambdaContext } from '@sls-testing/core'
import '@sls-testing/jest'
import { handler } from './process-order'

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
          ORDERS_TABLE: 'orders-test',
          NOTIFICATION_TOPIC: 'arn:aws:sns:us-east-1:123456789012:order-notifications-test',
        },
        events: [{ http: { path: '/orders', method: 'post' } }],
      },
    },
    provider: { stage: 'test', region: 'us-east-1' },
  },
  config: { servicePath: __dirname },
} as any

const plugin = new ServerlessTestingPlugin(serverless, {})
```

### Step 2: Load function metadata and environment

```typescript
const fnConfig = plugin.getFunction('processOrder')

beforeAll(() => {
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

```typescript
const context = buildLambdaContext({
  functionName: fnConfig.name,
  memoryLimitInMB: String(fnConfig.memorySize),
  remainingTimeOverride: (fnConfig.timeout ?? 30) * 1000,
})
```

### Step 4: Write tests with full serverless context

```typescript
describe('processOrder handler', () => {
  it('has the expected function configuration', () => {
    expect(fnConfig.handler).toBe('src/handlers/process-order.handler')
    expect(fnConfig.memorySize).toBe(512)
    expect(fnConfig.timeout).toBe(30)
  })

  it('creates an order using env from serverless.yml', async () => {
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

  it('returns 400 when body is missing', async () => {
    const event = buildApiGatewayV1Event({
      httpMethod: 'POST',
      path: '/orders',
    })

    const result = await handler(event)

    expect(result).toBeClientError()
  })
})

describe('plugin metadata', () => {
  it('lists all functions', () => {
    const all = plugin.getAllFunctions()
    expect(Object.keys(all)).toContain('processOrder')
  })

  it('throws for unknown function names', () => {
    expect(() => plugin.getFunction('doesNotExist')).toThrow(
      /Function "doesNotExist" not found/,
    )
  })
})
```
