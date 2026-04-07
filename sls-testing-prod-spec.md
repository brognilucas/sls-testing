# Production Spec — `@sls-testing`

> Open source monorepo of testing utilities for AWS Lambda and serverless applications.  
> Designed to complement the *Testing Serverless Applications (TDD in the Real World)* ebook.

---

## 1. Vision

Make testing AWS Lambda functions as natural and frictionless as testing any other Node.js code. Provide typed, composable utilities that eliminate the boilerplate every serverless developer writes from scratch.

---

## 2. Goals

| Goal | Description |
|------|-------------|
| **Developer adoption** | Measurable via npm weekly downloads |
| **Community citations** | Blog posts, YouTube videos, and docs referencing the package |
| **Ebook synergy** | Every chapter of the ebook can reference real `@sls-testing` usage |
| **Open source credibility** | Stars, forks, and contributors as evidence of relevance |

---

## 3. Non-Goals (v1)

- No support for Python or Go (Node.js/TypeScript only in v1)
- No test runner (Jest/Vitest agnostic at core level)
- No deployment tooling
- No mocking of AWS SDK calls (out of scope — use `aws-sdk-mock` or `@aws-sdk/client-mock` for that)

---

## 4. Package Architecture

Monorepo structure using **pnpm workspaces** + **Turborepo**.

```
@sls-testing/
├── packages/
│   ├── core/               ← @sls-testing/core
│   ├── jest/               ← @sls-testing/jest
│   └── serverless-plugin/  ← serverless-testing-plugin
├── examples/
│   ├── basic-lambda/
│   ├── api-gateway/
│   └── sqs-consumer/
├── docs/
└── turbo.json
```

### Package responsibilities

**`@sls-testing/core`**
- Event builders
- Lambda context mock factory
- Response asserters
- Framework-agnostic (no Jest/Vitest imports)

**`@sls-testing/jest`**
- Custom Jest matchers that wrap core asserters
- Setup helpers (`setupServerlessTesting()`)
- Typed expect extensions (`expect(response).toLambdaSucceed()`)

**`serverless-testing-plugin`**
- Serverless Framework plugin
- Reads `serverless.yml` and exposes function metadata to tests
- Thin wrapper over `@sls-testing/core`
- Listed on Serverless Framework Marketplace

---

## 5. Core API Design (`@sls-testing/core`)

### 5.1 Event Builders

Typed factory functions that generate valid AWS event payloads. Each builder accepts a partial override object, merging with sensible defaults.

```typescript
import { buildApiGatewayEvent, buildSQSEvent, buildS3Event, buildEventBridgeEvent } from '@sls-testing/core'

// API Gateway v2 (HTTP API)
const event = buildApiGatewayEvent({
  method: 'POST',
  path: '/users',
  body: { name: 'Lucas' },
  headers: { Authorization: 'Bearer token123' },
  pathParameters: { id: '42' },
  queryStringParameters: { page: '1' }
})

// SQS
const event = buildSQSEvent({
  records: [
    { body: { orderId: 'abc-123', amount: 99.90 } },
    { body: { orderId: 'def-456', amount: 49.90 } }
  ]
})

// S3
const event = buildS3Event({
  bucket: 'my-bucket',
  key: 'uploads/image.png',
  eventName: 's3:ObjectCreated:Put'
})

// EventBridge
const event = buildEventBridgeEvent({
  source: 'app.orders',
  detailType: 'OrderPlaced',
  detail: { orderId: 'abc-123' }
})
```

**Supported event sources (v1):**
- `buildApiGatewayEvent` — API GW REST (v1) and HTTP API (v2)
- `buildSQSEvent` — single and batch records
- `buildS3Event` — ObjectCreated, ObjectRemoved
- `buildEventBridgeEvent` — custom and AWS native events
- `buildSNSEvent`
- `buildDynamoDBStreamEvent`

---

### 5.2 Lambda Context Mock

```typescript
import { buildLambdaContext } from '@sls-testing/core'

const context = buildLambdaContext({
  functionName: 'my-service-dev-processOrder',
  memoryLimitInMB: '512',
  remainingTimeOverride: 3000 // ms — simulates timeout pressure
})

// context.getRemainingTimeInMillis() returns the overridden value
// All required Context fields populated with safe defaults
```

**Context fields covered:**
- `functionName`, `functionVersion`, `invokedFunctionArn`
- `memoryLimitInMB`, `awsRequestId`, `logGroupName`, `logStreamName`
- `getRemainingTimeInMillis()` — overridable for timeout testing
- `callbackWaitsForEmptyEventLoop`

---

### 5.3 Response Asserters

```typescript
import { assertApiResponse, assertSQSBatchResponse } from '@sls-testing/core'

// API Gateway response
assertApiResponse(response, {
  statusCode: 201,
  bodyContains: { userId: expect.any(String) },
  headers: { 'Content-Type': 'application/json' }
})

// SQS partial batch failure
assertSQSBatchResponse(response, {
  failedMessageIds: ['msg-id-2'],
  succeededCount: 2
})
```

**Asserters (v1):**
- `assertApiResponse` — status code, body shape, headers
- `assertSQSBatchResponse` — itemFailures validation
- `assertLambdaError` — typed error responses
- `assertNoSideEffects` — ensures no unexpected calls were made (works with jest.spyOn)

---

## 6. Jest Package API (`@sls-testing/jest`)

```typescript
import '@sls-testing/jest' // extends expect automatically

// Custom matchers
expect(response).toHaveStatusCode(201)
expect(response).toMatchLambdaResponse({ body: { userId: '123' } })
expect(response).toBeSuccessfulApiResponse()    // 2xx
expect(response).toBeClientError()              // 4xx
expect(response).toBeServerError()              // 5xx
expect(sqsResponse).toHaveNoFailedMessages()
expect(sqsResponse).toHaveFailedMessage('msg-id-2')

// Setup helper
import { setupServerlessTesting } from '@sls-testing/jest'

beforeAll(() => {
  setupServerlessTesting({
    timezone: 'UTC',
    suppressLogs: true   // silences console.log during test runs
  })
})
```

---

## 7. Serverless Plugin (`serverless-testing-plugin`)

```yaml
# serverless.yml
plugins:
  - serverless-testing-plugin

custom:
  serverlessTesting:
    envFile: .env.test
    autoLoadEnv: true
```

**What the plugin does:**
- Exposes `getFunction(name)` utility to load function metadata from `serverless.yml` in tests
- Auto-loads `.env.test` before test runs via `sls test` command
- Generates a `sls-testing.config.json` with resolved env vars and function ARNs for local use

---

## 8. TypeScript Support

- All packages written in TypeScript
- Full type inference on event builder overrides (Partial<APIGatewayProxyEventV2>)
- Exported types for all builders and asserters
- Strict mode enabled
- Compiled to both CJS and ESM

---

## 9. Testing the Library Itself

- Jest for unit tests
- 100% coverage requirement on `core` package
- Integration tests using LocalStack for event parsing validation
- CI via GitHub Actions on every PR

---

## 10. Versioning & Release Strategy

- Semantic versioning across all packages (synchronized)
- `changesets` for changelog management
- Automated npm publish via GitHub Actions on merge to `main`
- Pre-release channel: `@sls-testing/core@beta`

---

## 11. Documentation

| Doc | Location | Purpose |
|-----|----------|---------|
| README (root) | GitHub | Project overview, install, quick start |
| README (per package) | Each package dir | Package-specific API docs |
| Docs site | `docs/` (Docusaurus or Nextra) | Full API reference + guides |
| Examples | `examples/` | Runnable examples per trigger type |
| Blog posts | Practical Serverless | Adoption driver + SEO |

---

## 12. Roadmap

### v1.0 — MVP
- [ ] Event builders: API GW, SQS, S3, EventBridge, SNS, DynamoDB Streams
- [ ] Lambda context mock
- [ ] Core response asserters
- [ ] `@sls-testing/jest` custom matchers
- [ ] `serverless-testing-plugin` v1
- [ ] GitHub Actions CI
- [ ] Root README + per-package READMEs
- [ ] Published to npm

### v1.1
- [ ] Docusaurus docs site
- [ ] `buildStepFunctionsEvent`
- [ ] `buildAppSyncEvent`
- [ ] VSCode snippet pack

### v2.0 (post-ebook launch)
- [ ] Vitest adapter (`@sls-testing/vitest`)
- [ ] CDK construct for test infrastructure
- [ ] Integration test runner (contract-based)

---

## 13. Success Metrics (6 months post-launch)

| Metric | Target |
|--------|--------|
| npm weekly downloads | 500+ |
| GitHub stars | 200+ |
| External blog citations | 5+ |
| Serverless Framework Marketplace listing | ✅ |
| Referenced in ebook | Every testing chapter |

---

## 14. Open Source Hygiene

- MIT License
- `CONTRIBUTING.md` from day one
- Issue templates (bug, feature request)
- PR template with checklist
- Code of Conduct
- GitHub Discussions enabled
- `good first issue` labels to attract contributors

---

*Spec version: 1.0 — April 2026*  
*Author: Lucas — Practical Serverless*
