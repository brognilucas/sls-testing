import { deepMerge } from '../../utils/deep-merge'

describe('deepMerge', () => {
  it('combines two objects preserving unset fields', () => {
    const target = { a: 1, b: { c: 2, d: 3 } }
    const source = { b: { c: 99 } }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: { c: 99, d: 3 } })
  })

  it('replaces target field with null when source has null', () => {
    const target = { a: 1, b: 'hello' }
    const source = { b: null }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: null })
  })

  it('replaces arrays entirely (no concatenation)', () => {
    const target = { items: [1, 2, 3] }
    const source = { items: [4, 5] }
    const result = deepMerge(target, source)
    expect(result).toEqual({ items: [4, 5] })
  })

  it('leaves target unchanged with empty object source', () => {
    const target = { a: 1, b: 2 }
    const source = {}
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('skips undefined values in source', () => {
    const target = { a: 1, b: 2 }
    const source = { a: undefined, b: 99 }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: 99 })
  })

  it('deeply merges nested objects', () => {
    const target = {
      requestContext: {
        http: { method: 'GET', sourceIp: '127.0.0.1' },
        stage: '$default',
      },
    }
    const source = {
      requestContext: { http: { method: 'POST' } },
    }
    const result = deepMerge(target, source)
    expect(result).toEqual({
      requestContext: {
        http: { method: 'POST', sourceIp: '127.0.0.1' },
        stage: '$default',
      },
    })
  })

  it('does not mutate the original target', () => {
    const target = { a: 1, b: { c: 2 } }
    const source = { b: { c: 99 } }
    deepMerge(target, source)
    expect(target).toEqual({ a: 1, b: { c: 2 } })
  })

  it('replaces primitive with object', () => {
    const target = { a: 'string' } as Record<string, unknown>
    const source = { a: { nested: true } }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: { nested: true } })
  })
})
