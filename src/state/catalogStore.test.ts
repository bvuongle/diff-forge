import { beforeEach, describe, expect, it } from 'vitest'

import type { CatalogDocument } from '@domain/catalog/CatalogTypes'
import { useCatalogStore } from '@state/catalogStore'

const mockCatalog: CatalogDocument = {
  schema: 'diff.catalog.v1',
  components: [
    {
      type: 'LinkEth',
      source: 'diff_broker',
      version: '1.0.0',
      implements: ['ILink'],
      requires: [],
      configSchema: {}
    }
  ]
}

describe('catalogStore', () => {
  beforeEach(() => {
    useCatalogStore.setState({ status: { status: 'loading' }, catalog: null })
  })

  it('starts in loading status with null catalog', () => {
    expect(useCatalogStore.getState().status).toEqual({ status: 'loading' })
    expect(useCatalogStore.getState().catalog).toBeNull()
  })

  it('setStatus(ready) exposes the catalog', () => {
    useCatalogStore.getState().setStatus({ status: 'ready', catalog: mockCatalog, repos: [] })
    expect(useCatalogStore.getState().catalog).toEqual(mockCatalog)
  })

  it('setStatus(unconfigured) clears the catalog', () => {
    useCatalogStore.getState().setStatus({ status: 'ready', catalog: mockCatalog, repos: [] })
    useCatalogStore.getState().setStatus({ status: 'unconfigured' })
    expect(useCatalogStore.getState().catalog).toBeNull()
  })
})
