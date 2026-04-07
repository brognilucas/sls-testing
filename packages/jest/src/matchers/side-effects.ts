export function toHaveNoSideEffects(
  this: jest.MatcherContext,
  received: jest.Mock | jest.SpyInstance,
) {
  const calls = received.mock.calls
  const pass = calls.length === 0

  return {
    pass,
    message: () =>
      pass
        ? `Expected mock to have been called, but it was not`
        : `Expected no side effects, but mock was called ${calls.length} time(s) with: ${JSON.stringify(calls)}`,
  }
}
