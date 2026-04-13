import { beforeEach, describe, expect, it } from 'vitest'
import type { CatalogDocument } from '@domain/catalog/CatalogTypes'
import { useCatalogStore } from '@state/catalogStore'

const mockCatalog: CatalogDocument = {
  schema: 'diff.catalog.v1',
  components: [
    {
      type: 'LinkEth',
      module: 'diff_broker',
      versions: {
        '1.0.0': { implements: ['ILink'], requires: [], configSchema: {} }
      }
    }
  ]
}

describe('catalogStore', () => {
  beforeEach(() => {
    useCatalogStore.setState({
      catalog: null,
      loading: false,
      error: null
    })
  })

  it('starts with null catalog', () => {
    expect(useCatalogStore.getState().catalog).toBeNull()
  })

  it('starts not loading', () => {
    expect(useCatalogStore.getState().loading).toBe(false)
  })

  it('starts with no error', () => {
    expect(useCatalogStore.getState().error).toBeNull()
  })

  it('setCatalog sets the catalog', () => {
    useCatalogStore.getState().setCatalog(mockCatalog)
    expect(useCatalogStore.getState().catalog).toEqual(mockCatalog)
  })

  it('setLoading sets loading state', () => {
    useCatalogStore.getState().setLoading(true)
    expect(useCatalogStore.getState().loading).toBe(true)
  })

  it('setError sets the error message', () => {
    useCatalogStore.getState().setError('Failed to load')
    expect(useCatalogStore.getState().error).toBe('Failed to load')
  })

  it('setError(null) clears the error', () => {
    useCatalogStore.getState().setError('error')
    useCatalogStore.getState().setError(null)
    expect(useCatalogStore.getState().error).toBeNull()
  })
})
