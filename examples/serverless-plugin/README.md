# Example: Serverless Plugin Integration

This example demonstrates how `serverless-testing-plugin` works with `@sls-testing/core` and `@sls-testing/jest` to test Lambda handlers using metadata from `serverless.yml`.

## What it shows

1. **Plugin reads `serverless.yml`** -- `getFunction('processOrder')` returns handler path, memorySize, timeout, environment variables, and events.

2. **Environment from serverless.yml** -- The test loads `ORDERS_TABLE` from the function's environment config, matching what Lambda would receive in production.

3. **Context from function config** -- `buildLambdaContext()` is configured with the function's actual name, memory limit, and timeout from `serverless.yml`.

4. **Event builders + Jest matchers** -- Full integration of all three packages in a realistic test scenario.

## Run

```bash
npm test
```

## Project structure

```
serverless-plugin/
  serverless.yml              <- your service definition
  .env.test                   <- test environment variables
  src/handlers/
    process-order.ts          <- POST /orders handler
    process-order.test.ts     <- tests using plugin metadata
    get-order.ts              <- GET /orders/{id} handler
    get-order.test.ts         <- tests using plugin metadata
```
