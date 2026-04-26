import { describe, expect, it } from 'vitest'

import { ComponentFragmentZ, fragmentToComponent } from './CatalogWireSchema'

describe('ComponentFragmentZ', () => {
  it('parses a valid fragment without source', () => {
    const parsed = ComponentFragmentZ.parse({
      type: 'LinkEth',
      version: '1.1.0',
      implements: ['ILink'],
      requires: [],
      configSchema: { mtu: { type: 'uint16', min: 576, max: 9000, default: 1500 } }
    })
    expect(parsed.version).toBe('1.1.0')
  })

  it('rejects fragment missing required fields', () => {
    expect(() =>
      ComponentFragmentZ.parse({
        type: 'LinkEth',
        version: '1.0.0'
      })
    ).toThrow()
  })
})

describe('fragmentToComponent', () => {
  it('stamps source from the fetcher onto a sourceless fragment', () => {
    const component = fragmentToComponent(
      {
        type: 'LinkEth',
        version: '1.0.0',
        implements: [],
        requires: [],
        configSchema: {}
      },
      'https://art.example/artifactory/diff'
    )
    expect(component.type).toBe('LinkEth')
    expect(component.source).toBe('https://art.example/artifactory/diff')
  })
})
