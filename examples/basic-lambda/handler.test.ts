import { buildLambdaContext } from '@sls-testing/core'
import { handler } from './handler'

// Register Jest matchers
import '@sls-testing/jest'

describe('Basic Lambda Handler', () => {
  it('returns a successful response with function metadata', async () => {
    const context = buildLambdaContext({
      functionName: 'my-hello-function',
    })

    const result = await handler({}, context)

    expect(result).toHaveStatusCode(200)

    const body = JSON.parse(result.body)
    expect(body.message).toBe('Hello from Lambda!')
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
