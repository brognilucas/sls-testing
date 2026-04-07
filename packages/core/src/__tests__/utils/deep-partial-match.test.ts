import { deepPartialMatch } from '../../utils/deep-partial-match'

describe('deepPartialMatch', () => {
  it('passes when expected is a subset of actual', () => {
    const actual = { a: 1, b: { c: 2, d: 3 } }
    const expected = { b: { c: 2 } }
    expect(deepPartialMatch(actual, expected)).toEqual({ pass: true })
  })

  it('fails with diff when values mismatch', () => {
    const actual = { a: 1 }
    const expected = { a: 2 }
    const result = deepPartialMatch(actual, expected)
    expect(result.pass).toBe(false)
    expect(result.diff).toContain('expected 2')
    expect(result.diff).toContain('received 1')
  })

  it('matches arrays exactly (not partially)', () => {
    const actual = { a: [1, 2] }
    const expected = { a: [1, 2] }
    expect(deepPartialMatch(actual, expected)).toEqual({ pass: true })
  })

  it('fails when array lengths differ', () => {
    const actual = { a: [1, 2, 3] }
    const expected = { a: [1, 2] }
    const result = deepPartialMatch(actual, expected)
    expect(result.pass).toBe(false)
    expect(result.diff).toContain('array length')
  })

  it('matches null with null', () => {
    const actual = { a: null }
    const expected = { a: null }
    expect(deepPartialMatch(actual, expected)).toEqual({ pass: true })
  })

  it('fails when expected key is missing in actual', () => {
    const actual = { a: 1 }
    const expected = { b: 2 }
    const result = deepPartialMatch(actual, expected)
    expect(result.pass).toBe(false)
    expect(result.diff).toContain('missing')
  })

  it('works with deeply nested objects', () => {
    const actual = {
      level1: {
        level2: {
          level3: { value: 'deep' },
        },
      },
    }
    const expected = { level1: { level2: { level3: { value: 'deep' } } } }
    expect(deepPartialMatch(actual, expected)).toEqual({ pass: true })
  })

  it('handles primitives directly', () => {
    expect(deepPartialMatch(42, 42)).toEqual({ pass: true })
    expect(deepPartialMatch('hello', 'hello')).toEqual({ pass: true })
    const result = deepPartialMatch(42, 99)
    expect(result.pass).toBe(false)
  })
})
