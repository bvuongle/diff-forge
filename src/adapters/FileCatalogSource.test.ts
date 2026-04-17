import { describe, expect, it, vi } from 'vitest'

import { createFileCatalogSource } from './FileCatalogSource'

const validCatalog = JSON.stringify({
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
})

describe('FileCatalogSource', () => {
  it('parses valid catalog JSON', async () => {
    const source = createFileCatalogSource({
      filePath: '/mock/catalog.json',
      loadFile: vi.fn().mockResolvedValue(validCatalog)
    })
    const result = await source.loadCatalog()
    expect(result.schema).toBe('diff.catalog.v1')
    expect(result.components).toHaveLength(1)
    expect(result.components[0].type).toBe('LinkEth')
  })

  it('calls loadFile with the configured path', async () => {
    const loadFile = vi.fn().mockResolvedValue(validCatalog)
    const source = createFileCatalogSource({ filePath: '/my/path.json', loadFile })
    await source.loadCatalog()
    expect(loadFile).toHaveBeenCalledWith('/my/path.json')
  })

  it('throws on invalid JSON', async () => {
    const source = createFileCatalogSource({
      filePath: '/mock/bad.json',
      loadFile: vi.fn().mockResolvedValue('not json')
    })
    await expect(source.loadCatalog()).rejects.toThrow()
  })

  it('throws on missing required fields', async () => {
    const incomplete = JSON.stringify({ schema: 'diff.catalog.v1' })
    const source = createFileCatalogSource({
      filePath: '/mock/catalog.json',
      loadFile: vi.fn().mockResolvedValue(incomplete)
    })
    await expect(source.loadCatalog()).rejects.toThrow()
  })
})
