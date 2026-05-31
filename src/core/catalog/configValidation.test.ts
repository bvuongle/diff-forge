import { describe, expect, it } from 'vitest'

import type { Graph } from '@core/graph/GraphTypes'

import type { CatalogComponent, ConfigValueSchema } from './CatalogSchema'
import { validateConfig, validateConfigValue, validateNodeConfigs } from './configValidation'

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

describe('validateConfig', () => {
  const objSchema: Record<string, ConfigValueSchema> = {
    count: { type: 'uint8', min: 0, max: 100 },
    label: { type: 'string' }
  }

  it('returns no errors when every value is valid', () => {
    expect(validateConfig(objSchema, { count: 50, label: 'ok' })).toEqual([])
  })

  it('flags out-of-range and wrong-typed values', () => {
    expect(validateConfig(objSchema, { count: 300, label: 5 })).toEqual([
      { field: 'count', error: 'Must be between 0 and 100' },
      { field: 'label', error: 'Must be text' }
    ])
  })

  it('flags fields not declared in the schema', () => {
    expect(validateConfig(objSchema, { extra: 1 })).toEqual([{ field: 'extra', error: 'Unknown field' }])
  })
})

describe('validateNodeConfigs', () => {
  const catalog: CatalogComponent[] = [
    {
      type: 'LinkGsm',
      version: '1.0.0',
      source: 'repo',
      implements: [],
      requires: [],
      config: { count: { type: 'uint8', min: 0, max: 100 } }
    }
  ]

  it('reports a violation per offending node, tagged with node and instance ids', () => {
    const graph = {
      nodes: [
        {
          id: 'n1',
          instanceId: 'gsm0',
          componentType: 'LinkGsm',
          version: '1.0.0',
          source: 'repo',
          configData: { count: 300 }
        }
      ],
      edges: []
    } as unknown as Graph
    expect(validateNodeConfigs(graph, catalog)).toEqual([
      { nodeId: 'n1', instanceId: 'gsm0', field: 'count', error: 'Must be between 0 and 100' }
    ])
  })

  it('skips nodes with no matching catalog entry', () => {
    const graph = {
      nodes: [
        {
          id: 'n1',
          instanceId: 'x',
          componentType: 'Ghost',
          version: '9.9.9',
          source: 'repo',
          configData: { count: 300 }
        }
      ],
      edges: []
    } as unknown as Graph
    expect(validateNodeConfigs(graph, catalog)).toEqual([])
  })
})
