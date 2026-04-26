import { describe, expect, it } from 'vitest'

import type { CatalogDocument } from './CatalogSchema'
import { mergeCatalogs } from './mergeCatalogs'

function make(components: CatalogDocument['components']): CatalogDocument {
  return { components }
}

describe('mergeCatalogs', () => {
  it('returns an empty catalog when given no docs', () => {
    const merged = mergeCatalogs([])
    expect(merged).toEqual({ components: [] })
  })

  it('concatenates components from distinct repos', () => {
    const a = make([{ type: 'A', source: 's1', version: '1.0', implements: [], requires: [], configSchema: {} }])
    const b = make([{ type: 'B', source: 's2', version: '1.0', implements: [], requires: [], configSchema: {} }])
    const merged = mergeCatalogs([a, b])
    expect(merged.components.map((c) => c.type)).toEqual(['A', 'B'])
  })

  it('deduplicates on (source, type, version); first wins', () => {
    const a = make([{ type: 'A', source: 's', version: '1.0', implements: ['v1'], requires: [], configSchema: {} }])
    const b = make([{ type: 'A', source: 's', version: '1.0', implements: ['v2'], requires: [], configSchema: {} }])
    const merged = mergeCatalogs([a, b])
    expect(merged.components).toHaveLength(1)
    expect(merged.components[0].implements).toEqual(['v1'])
  })

  it('keeps different versions of the same component', () => {
    const a = make([
      { type: 'A', source: 's', version: '1.0', implements: [], requires: [], configSchema: {} },
      { type: 'A', source: 's', version: '2.0', implements: [], requires: [], configSchema: {} }
    ])
    const merged = mergeCatalogs([a])
    expect(merged.components).toHaveLength(2)
  })
})
