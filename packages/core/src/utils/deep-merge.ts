/**
 * Recursively merges source into target.
 * - Preserves target fields not present in source
 * - Replaces arrays entirely (no concatenation)
 * - Skips undefined values in source
 * - null in source replaces target field with null
 */
export function deepMerge<T>(
  target: T,
  source: Partial<T> | Record<string, unknown>,
): T {
  const result = { ...target } as Record<string, unknown>
  const src = source as Record<string, unknown>

  for (const key of Object.keys(src)) {
    const sourceVal = src[key]
    const targetVal = result[key]

    // Skip undefined — don't overwrite target
    if (sourceVal === undefined) {
      continue
    }

    // null replaces target
    if (sourceVal === null) {
      result[key] = null
      continue
    }

    // Arrays replace entirely
    if (Array.isArray(sourceVal)) {
      result[key] = sourceVal
      continue
    }

    // Recurse into plain objects
    if (
      isPlainObject(sourceVal) &&
      isPlainObject(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      )
      continue
    }

    // Primitive or non-plain object — replace
    result[key] = sourceVal
  }

  return result as T
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  )
}
