import { describe, expect, it, vi } from 'vitest'

import { CATALOG_FILE, createFileCatalogSource } from './FileCatalogSource'

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
  it('returns ready with the parsed catalog when the file is valid', async () => {
    const source = createFileCatalogSource({
      env: { [CATALOG_FILE]: '/mock/catalog.json' },
      readFile: vi.fn().mockResolvedValue(validCatalog)
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.catalog.components).toHaveLength(1)
    expect(result.catalog.components[0].type).toBe('LinkEth')
    expect(result.repos).toEqual([{ url: '/mock/catalog.json', status: 'ok' }])
  })

  it('calls readFile with the configured path', async () => {
    const readFile = vi.fn().mockResolvedValue(validCatalog)
    const source = createFileCatalogSource({ env: { [CATALOG_FILE]: '/my/path.json' }, readFile })
    await source.loadCatalog()
    expect(readFile).toHaveBeenCalledWith('/my/path.json')
  })

  it('returns unconfigured when DF_CATALOG_FILE is missing', async () => {
    const source = createFileCatalogSource({ env: {}, readFile: vi.fn() })
    const result = await source.loadCatalog()
    expect(result.status).toBe('unconfigured')
    if (result.status !== 'unconfigured') return
    expect(result.missing).toEqual([CATALOG_FILE])
  })

  it('returns error on invalid JSON', async () => {
    const source = createFileCatalogSource({
      env: { [CATALOG_FILE]: '/mock/bad.json' },
      readFile: vi.fn().mockResolvedValue('not json')
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('error')
    if (result.status !== 'error') return
    expect(result.repos[0].status).toBe('failed')
  })

  it('returns error on missing required fields', async () => {
    const incomplete = JSON.stringify({ schema: 'diff.catalog.v1' })
    const source = createFileCatalogSource({
      env: { [CATALOG_FILE]: '/mock/catalog.json' },
      readFile: vi.fn().mockResolvedValue(incomplete)
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('error')
  })
})
