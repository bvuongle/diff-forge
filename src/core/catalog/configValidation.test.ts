import { describe, expect, it } from 'vitest'

import type { ConfigValueSchema } from './CatalogSchema'
import { validateConfigValue } from './configValidation'

const schema = (s: ConfigValueSchema) => s

describe('validateConfigValue', () => {
  describe('string', () => {
    it('accepts any text', () => {
      expect(validateConfigValue(schema({ type: 'string' }), 'anything goes')).toEqual({
        ok: true,
        value: 'anything goes'
      })
    })

    it('accepts an empty string (no length constraint)', () => {
      expect(validateConfigValue(schema({ type: 'string' }), '')).toEqual({ ok: true, value: '' })
    })

    it('ignores min/max for strings', () => {
      const long = 'x'.repeat(5000)
      expect(validateConfigValue(schema({ type: 'string', max: 3 }), long)).toEqual({ ok: true, value: long })
    })
  })

  describe('integer types', () => {
    it('parses a valid integer', () => {
      expect(validateConfigValue(schema({ type: 'int' }), '10')).toEqual({ ok: true, value: 10 })
    })

    it('rejects non-numeric input', () => {
      expect(validateConfigValue(schema({ type: 'int' }), 'abc')).toEqual({ ok: false, error: 'Must be a number' })
    })

    it('rejects an empty value', () => {
      expect(validateConfigValue(schema({ type: 'int' }), '   ')).toEqual({ ok: false, error: 'Must be a number' })
    })

    it('rejects a decimal in an integer field', () => {
      expect(validateConfigValue(schema({ type: 'int' }), '1.5')).toEqual({
        ok: false,
        error: 'Must be an integer'
      })
    })

    it('uses the C++ type range when the schema declares no bounds', () => {
      expect(validateConfigValue(schema({ type: 'uint8' }), '300')).toEqual({
        ok: false,
        error: 'Must be between 0 and 255'
      })
      expect(validateConfigValue(schema({ type: 'uint8' }), '255')).toEqual({ ok: true, value: 255 })
      expect(validateConfigValue(schema({ type: 'uint8' }), '-1')).toEqual({
        ok: false,
        error: 'Must be between 0 and 255'
      })
    })

    it('lets the schema tighten the type range', () => {
      const s = schema({ type: 'uint8', min: 10, max: 100 })
      expect(validateConfigValue(s, '5')).toEqual({ ok: false, error: 'Must be between 10 and 100' })
      expect(validateConfigValue(s, '50')).toEqual({ ok: true, value: 50 })
    })
  })

  describe('float/double', () => {
    it('accepts a decimal value', () => {
      expect(validateConfigValue(schema({ type: 'float' }), '1.5')).toEqual({ ok: true, value: 1.5 })
    })

    it('still rejects non-numeric input', () => {
      expect(validateConfigValue(schema({ type: 'double' }), 'NaNa')).toEqual({
        ok: false,
        error: 'Must be a number'
      })
    })

    it('applies only a schema-declared lower bound', () => {
      expect(validateConfigValue(schema({ type: 'float', min: 0 }), '-5')).toEqual({
        ok: false,
        error: 'Must be at least 0'
      })
    })

    it('applies only a schema-declared upper bound', () => {
      expect(validateConfigValue(schema({ type: 'float', max: 10 }), '20')).toEqual({
        ok: false,
        error: 'Must be at most 10'
      })
    })
  })
})
