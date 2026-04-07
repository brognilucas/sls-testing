import { buildLambdaContext } from '../context'

describe('buildLambdaContext', () => {
  it('returns a valid Context with all required fields', () => {
    const ctx = buildLambdaContext()

    expect(ctx.functionName).toBe('test-function')
    expect(ctx.functionVersion).toBe('$LATEST')
    expect(ctx.memoryLimitInMB).toBe('128')
    expect(typeof ctx.awsRequestId).toBe('string')
    expect(ctx.awsRequestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(ctx.logGroupName).toBe('/aws/lambda/test-function')
    expect(ctx.logStreamName).toContain('[$LATEST]')
    expect(ctx.logStreamName).toContain(ctx.awsRequestId)
    expect(ctx.invokedFunctionArn).toContain('test-function')
    expect(ctx.callbackWaitsForEmptyEventLoop).toBe(true)
    expect(typeof ctx.getRemainingTimeInMillis).toBe('function')
    expect(typeof ctx.done).toBe('function')
    expect(typeof ctx.fail).toBe('function')
    expect(typeof ctx.succeed).toBe('function')
  })

  it('derives logGroupName and invokedFunctionArn from overridden functionName', () => {
    const ctx = buildLambdaContext({ functionName: 'my-func' })

    expect(ctx.functionName).toBe('my-func')
    expect(ctx.logGroupName).toBe('/aws/lambda/my-func')
    expect(ctx.invokedFunctionArn).toContain('my-func')
  })

  it('returns remainingTimeOverride from getRemainingTimeInMillis()', () => {
    const ctx = buildLambdaContext({ remainingTimeOverride: 500 })

    expect(ctx.getRemainingTimeInMillis()).toBe(500)
  })

  it('getRemainingTimeInMillis() is callable as a function', () => {
    const ctx = buildLambdaContext()

    expect(typeof ctx.getRemainingTimeInMillis).toBe('function')
    const result = ctx.getRemainingTimeInMillis()
    expect(typeof result).toBe('number')
  })

  it('keeps memoryLimitInMB as a string when overridden', () => {
    const ctx = buildLambdaContext({ memoryLimitInMB: '512' })

    expect(ctx.memoryLimitInMB).toBe('512')
    expect(typeof ctx.memoryLimitInMB).toBe('string')
  })

  it('done(), fail(), succeed() are callable no-ops that do not throw', () => {
    const ctx = buildLambdaContext()

    expect(() => ctx.done()).not.toThrow()
    expect(() => ctx.fail('error')).not.toThrow()
    expect(() => ctx.succeed('result')).not.toThrow()
  })

  it('awsRequestId is unique across multiple calls', () => {
    const ctx1 = buildLambdaContext()
    const ctx2 = buildLambdaContext()

    expect(ctx1.awsRequestId).not.toBe(ctx2.awsRequestId)
  })

  it('getRemainingTimeInMillis() returns the same value on repeated calls', () => {
    const ctx = buildLambdaContext()

    const first = ctx.getRemainingTimeInMillis()
    const second = ctx.getRemainingTimeInMillis()

    expect(first).toBe(second)
  })

  it('returns default remaining time of 30000 when no override', () => {
    const ctx = buildLambdaContext()

    expect(ctx.getRemainingTimeInMillis()).toBe(30_000)
  })
})
