import { matchers } from '../../matchers'

expect.extend(matchers)

describe('toHaveNoSideEffects', () => {
  it('passes when mock was not called', () => {
    const mockFn = jest.fn()
    expect(mockFn).toHaveNoSideEffects()
  })

  it('fails when mock was called', () => {
    const mockFn = jest.fn()
    mockFn('arg1', 'arg2')

    expect(() => {
      expect(mockFn).toHaveNoSideEffects()
    }).toThrow('Expected no side effects, but mock was called 1 time(s)')
  })

  it('includes call information in failure message', () => {
    const mockFn = jest.fn()
    mockFn('first')
    mockFn('second')

    expect(() => {
      expect(mockFn).toHaveNoSideEffects()
    }).toThrow('Expected no side effects, but mock was called 2 time(s)')
  })

  it('.not fails when mock was not called', () => {
    const mockFn = jest.fn()

    expect(() => {
      expect(mockFn).not.toHaveNoSideEffects()
    }).toThrow('Expected mock to have been called, but it was not')
  })

  it('works with jest.spyOn', () => {
    const obj = { method: () => 'original' }
    const spy = jest.spyOn(obj, 'method')

    expect(spy).toHaveNoSideEffects()

    spy.mockRestore()
  })

  it('fails with jest.spyOn when called', () => {
    const obj = { method: () => 'original' }
    const spy = jest.spyOn(obj, 'method')
    obj.method()

    expect(() => {
      expect(spy).toHaveNoSideEffects()
    }).toThrow('Expected no side effects, but mock was called 1 time(s)')

    spy.mockRestore()
  })
})
