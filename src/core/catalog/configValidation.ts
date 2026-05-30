import type { ConfigValueSchema } from './CatalogSchema'
import { numericBound, type NumericBound } from './configBounds'

type ConfigValidationOutcome = { ok: true; value: string | number } | { ok: false; error: string }

function validateConfigValue(schema: ConfigValueSchema, raw: string): ConfigValidationOutcome {
  const bound = numericBound(schema.type)
  if (bound) return validateNumeric(schema, raw, bound)
  return { ok: true, value: raw }
}

function validateNumeric(schema: ConfigValueSchema, raw: string, bound: NumericBound): ConfigValidationOutcome {
  const trimmed = raw.trim()
  const num = Number(trimmed)
  if (trimmed === '' || !Number.isFinite(num)) return { ok: false, error: 'Must be a number' }
  if (bound.integer && !Number.isInteger(num)) return { ok: false, error: 'Must be an integer' }

  const min = schema.min ?? bound.min
  const max = schema.max ?? bound.max
  if (num < min || num > max) return { ok: false, error: rangeError(min, max) }

  return { ok: true, value: num }
}

function rangeError(min: number, max: number): string {
  if (min === -Infinity) return `Must be at most ${max}`
  if (max === Infinity) return `Must be at least ${min}`
  return `Must be between ${min} and ${max}`
}

export { validateConfigValue }
export type { ConfigValidationOutcome }
