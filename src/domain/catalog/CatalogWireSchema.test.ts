import { describe, expect, it } from 'vitest'

import { CatalogIndexZ, ComponentFragmentZ, fragmentToComponent } from './CatalogWireSchema'

describe('CatalogIndexZ', () => {
  it('parses a valid index', () => {
    const parsed = CatalogIndexZ.parse({
      schema: 'diff.catalog.index.v2',
      repo: 'core',
      components: [{ source: 'diff_broker', type: 'LinkEth', versions: ['1.0.0', '1.1.0'] }]
    })
    expect(parsed.components).toHaveLength(1)
    expect(parsed.components[0].versions).toEqual(['1.0.0', '1.1.0'])
  })

  it('rejects index with wrong schema literal', () => {
    expect(() => CatalogIndexZ.parse({ schema: 'diff.catalog.v1', components: [] })).toThrow()
  })

  it('rejects entry with empty versions', () => {
    expect(() =>
      CatalogIndexZ.parse({
        schema: 'diff.catalog.index.v2',
        components: [{ source: 's', type: 't', versions: [] }]
      })
    ).toThrow()
  })
})

describe('ComponentFragmentZ', () => {
  it('parses a valid fragment', () => {
    const parsed = ComponentFragmentZ.parse({
      schema: 'diff.component.v2',
      type: 'LinkEth',
      source: 'diff_broker',
      version: '1.1.0',
      implements: ['ILink'],
      requires: [],
      configSchema: { mtu: { type: 'uint16', min: 576, max: 9000, default: 1500 } }
    })
    expect(parsed.version).toBe('1.1.0')
  })

  it('rejects fragment without schema field', () => {
    expect(() =>
      ComponentFragmentZ.parse({
        type: 'LinkEth',
        source: 'diff_broker',
        version: '1.0.0',
        implements: [],
        requires: [],
        configSchema: {}
      })
    ).toThrow()
  })
})

describe('fragmentToComponent', () => {
  it('drops the schema discriminator', () => {
    const component = fragmentToComponent({
      schema: 'diff.component.v2',
      type: 'LinkEth',
      source: 'diff_broker',
      version: '1.0.0',
      implements: [],
      requires: [],
      configSchema: {}
    })
    expect(component).not.toHaveProperty('schema')
    expect(component.type).toBe('LinkEth')
  })
})
