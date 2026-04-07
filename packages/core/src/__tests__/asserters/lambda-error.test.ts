import { assertLambdaError } from '../../asserters/lambda-error'

describe('assertLambdaError', () => {
  it('passes when error type matches', () => {
    const error = new TypeError('bad input')
    expect(() =>
      assertLambdaError(error, { errorType: 'TypeError' }),
    ).not.toThrow()
  })

  it('throws on error type mismatch', () => {
    const error = new RangeError('out of range')
    expect(() =>
      assertLambdaError(error, { errorType: 'TypeError' }),
    ).toThrow('Expected error type "TypeError", received "RangeError"')
  })

  it('matches message pattern as string', () => {
    const error = new Error('Something went wrong with validation')
    expect(() =>
      assertLambdaError(error, { messagePattern: 'validation' }),
    ).not.toThrow()
  })

  it('matches message pattern as RegExp', () => {
    const error = new Error('Error code: 42')
    expect(() =>
      assertLambdaError(error, { messagePattern: /code: \d+/ }),
    ).not.toThrow()
  })

  it('throws when RegExp pattern does not match', () => {
    const error = new Error('something')
    expect(() =>
      assertLambdaError(error, { messagePattern: /not found/i }),
    ).toThrow('Expected error message to match')
  })

  it('checks statusCode on structured error', () => {
    const error = Object.assign(new Error('not found'), { statusCode: 404 })
    expect(() =>
      assertLambdaError(error, { statusCode: 404 }),
    ).not.toThrow()
  })

  it('throws on statusCode mismatch', () => {
    const error = Object.assign(new Error('err'), { statusCode: 500 })
    expect(() =>
      assertLambdaError(error, { statusCode: 404 }),
    ).toThrow('Expected error statusCode 404, received 500')
  })
})
