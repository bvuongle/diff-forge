import type { ConfigValueType } from './CatalogSchema'

type NumericBound = { min: number; max: number; integer: boolean }

const NUMERIC_BOUNDS: Partial<Record<ConfigValueType, NumericBound>> = {
  int: { min: -2147483648, max: 2147483647, integer: true },
  uint: { min: 0, max: 4294967295, integer: true },
  int8: { min: -128, max: 127, integer: true },
  uint8: { min: 0, max: 255, integer: true },
  int16: { min: -32768, max: 32767, integer: true },
  uint16: { min: 0, max: 65535, integer: true },
  int32: { min: -2147483648, max: 2147483647, integer: true },
  uint32: { min: 0, max: 4294967295, integer: true },
  int64: { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER, integer: true },
  uint64: { min: 0, max: Number.MAX_SAFE_INTEGER, integer: true },
  float: { min: -Infinity, max: Infinity, integer: false },
  double: { min: -Infinity, max: Infinity, integer: false }
}

function numericBound(type: ConfigValueType): NumericBound | undefined {
  return NUMERIC_BOUNDS[type]
}

export { numericBound }
export type { NumericBound }
