import {
  generateUUID,
  generateTimestamp,
  generateRequestId,
  generateArn,
  DEFAULT_REGION,
  DEFAULT_ACCOUNT_ID,
} from '../../utils/generators'

describe('generateUUID', () => {
  it('returns a valid UUID v4 format', () => {
    const uuid = generateUUID()
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it('returns unique values across calls', () => {
    const a = generateUUID()
    const b = generateUUID()
    expect(a).not.toBe(b)
  })
})

describe('generateTimestamp', () => {
  it('returns a valid ISO 8601 string', () => {
    const ts = generateTimestamp()
    expect(new Date(ts).toISOString()).toBe(ts)
  })
})

describe('generateRequestId', () => {
  it('returns a valid UUID', () => {
    const id = generateRequestId()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })
})

describe('generateArn', () => {
  it('returns correctly formatted ARN with defaults', () => {
    const arn = generateArn('lambda', 'my-function')
    expect(arn).toBe(
      `arn:aws:lambda:${DEFAULT_REGION}:${DEFAULT_ACCOUNT_ID}:function:my-function`,
    )
  })

  it('accepts custom region and account', () => {
    const arn = generateArn('lambda', 'my-func', 'eu-west-1', '999888777666')
    expect(arn).toBe('arn:aws:lambda:eu-west-1:999888777666:function:my-func')
  })
})

describe('DEFAULT constants', () => {
  it('has expected default region', () => {
    expect(DEFAULT_REGION).toBe('us-east-1')
  })

  it('has expected default account ID', () => {
    expect(DEFAULT_ACCOUNT_ID).toBe('123456789012')
  })
})
