export interface MatchResult {
  pass: boolean
  diff?: string
}

/**
 * Recursively checks that every key in `expected` exists in `actual` with matching values.
 * Returns a structured result with diff on mismatch.
 */
export function deepPartialMatch(
  actual: unknown,
  expected: unknown,
  path = '',
): MatchResult {
  // Exact equality (handles primitives, null, undefined)
  if (actual === expected) {
    return { pass: true }
  }

  // null/undefined mismatch
  if (actual === null || actual === undefined || expected === null || expected === undefined) {
    return {
      pass: false,
      diff: `${path || 'root'}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    }
  }

  // Array comparison — exact match, not partial
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      return {
        pass: false,
        diff: `${path || 'root'}: expected array, received ${typeof actual}`,
      }
    }
    if (actual.length !== expected.length) {
      return {
        pass: false,
        diff: `${path || 'root'}: expected array length ${expected.length}, received ${actual.length}`,
      }
    }
    for (let i = 0; i < expected.length; i++) {
      const result = deepPartialMatch(actual[i], expected[i], `${path}[${i}]`)
      if (!result.pass) return result
    }
    return { pass: true }
  }

  // Object partial match
  if (typeof expected === 'object' && typeof actual === 'object') {
    const expectedObj = expected as Record<string, unknown>
    const actualObj = actual as Record<string, unknown>
    for (const key of Object.keys(expectedObj)) {
      const currentPath = path ? `${path}.${key}` : key
      if (!(key in actualObj)) {
        return {
          pass: false,
          diff: `${currentPath}: key missing in actual`,
        }
      }
      const result = deepPartialMatch(actualObj[key], expectedObj[key], currentPath)
      if (!result.pass) return result
    }
    return { pass: true }
  }

  // Primitive mismatch
  return {
    pass: false,
    diff: `${path || 'root'}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
  }
}
