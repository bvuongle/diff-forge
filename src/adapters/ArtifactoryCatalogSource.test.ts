import { gzipSync } from 'node:zlib'

import { describe, expect, it, vi } from 'vitest'

import type { CatalogDocument } from '@core/catalog/CatalogSchema'
import type { CatalogCache } from '@contracts/CatalogCache'

import { createArtifactoryCatalogSource } from './ArtifactoryCatalogSource'

const STORAGE_URL = 'https://art.example/artifactory/diff'
const API_BASE = 'https://art.example/artifactory/api/conan/diff'

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init
  })
}

function errorResponse(status: number, statusText = ''): Response {
  return new Response('', { status, statusText })
}

function makeTarball(filename: string, content: string): Buffer {
  const data = Buffer.from(content, 'utf8')
  const header = Buffer.alloc(512)
  header.write(filename, 0, Math.min(filename.length, 100), 'utf8')
  header.write(data.length.toString(8).padStart(11, '0'), 124, 11, 'utf8')
  header.write('0', 156, 1, 'utf8')
  header.write('ustar', 257, 5, 'utf8')
  header.write('00', 263, 2, 'utf8')
  const padding = (512 - (data.length % 512)) % 512
  return Buffer.concat([header, data, Buffer.alloc(padding), Buffer.alloc(1024)])
}

function tgzResponse(filename: string, body: unknown): Response {
  const tgz = gzipSync(makeTarball(filename, JSON.stringify(body)))
  return new Response(tgz, {
    status: 200,
    headers: { 'content-type': 'application/octet-stream' }
  })
}

type Routes = Record<string, () => Response>

function routedFetch(routes: Routes) {
  return vi.fn(async (url: RequestInfo | URL, _init?: RequestInit) => {
    const u = String(url)
    for (const [pattern, handler] of Object.entries(routes)) {
      if (u === pattern) return handler()
    }
    return errorResponse(404, 'Not Found')
  })
}

function fragment(type: string, version: string) {
  return {
    type,
    version,
    implements: ['ILink'],
    requires: [],
    configSchema: {}
  }
}

function memoryCache(seed: Record<string, CatalogDocument> = {}): CatalogCache & {
  store: Map<string, CatalogDocument>
} {
  const store = new Map<string, CatalogDocument>(Object.entries(seed))
  return {
    store,
    async readRepo(url) {
      return store.get(url) ?? null
    },
    async writeRepo(url, catalog) {
      store.set(url, catalog)
    }
  }
}

const standardRoutes: Routes = {
  [`${API_BASE}/v2/conans/search?q=*`]: () =>
    jsonResponse({ results: ['linketh/1.0.0@noembedded/stable', 'linkgsm/1.0.0@noembedded/stable'] }),
  [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions`]: () =>
    jsonResponse({ revisions: [{ revision: 'rev-eth', time: '2026-04-25T10:00:00Z' }] }),
  [`${API_BASE}/v2/conans/linkgsm/1.0.0/noembedded/stable/revisions`]: () =>
    jsonResponse({ revisions: [{ revision: 'rev-gsm', time: '2026-04-25T10:00:00Z' }] }),
  [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions/rev-eth/files/conan_export.tgz`]: () =>
    tgzResponse('diff.metadata.json', fragment('LinkEth', '1.0.0')),
  [`${API_BASE}/v2/conans/linkgsm/1.0.0/noembedded/stable/revisions/rev-gsm/files/conan_export.tgz`]: () =>
    tgzResponse('diff.metadata.json', fragment('LinkGsm', '1.0.0'))
}

describe('createArtifactoryCatalogSource - configuration', () => {
  it('returns unconfigured when DF_ARTIFACTORY_REPOS is missing', async () => {
    const source = createArtifactoryCatalogSource({ env: {}, fetch: vi.fn(), cache: memoryCache() })
    const result = await source.loadCatalog()
    expect(result).toEqual({ status: 'unconfigured', missing: ['DF_ARTIFACTORY_REPOS'] })
  })

  it('returns unconfigured when DF_ARTIFACTORY_REPOS is empty or whitespace', async () => {
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: '   ' },
      fetch: vi.fn(),
      cache: memoryCache()
    })
    expect((await source.loadCatalog()).status).toBe('unconfigured')

    const source2 = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: ',,  ,' },
      fetch: vi.fn(),
      cache: memoryCache()
    })
    expect((await source2.loadCatalog()).status).toBe('unconfigured')
  })

  it('flags duplicate URLs as error (ignoring trailing slash and case)', async () => {
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: 'https://a.example/conan/,https://A.example/conan' },
      fetch: vi.fn(),
      cache: memoryCache()
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('error')
    if (result.status !== 'error') return
    expect(result.message).toMatch(/duplicate/i)
  })
})

describe('createArtifactoryCatalogSource - single repo fetch', () => {
  it('returns ready with merged components on a full successful fetch', async () => {
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: routedFetch(standardRoutes),
      cache: memoryCache()
    })
    const result = await source.loadCatalog()

    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.catalog.components.map((c) => `${c.type}@${c.version}`).sort()).toEqual([
      'LinkEth@1.0.0',
      'LinkGsm@1.0.0'
    ])
    expect(result.repos).toEqual([{ url: STORAGE_URL, status: 'ok' }])
  })

  it('extracts metadata even when tarball nests it under a folder', async () => {
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: routedFetch({
        [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: ['linketh/1.0.0@noembedded/stable'] }),
        [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions`]: () =>
          jsonResponse({ revisions: [{ revision: 'rev1' }] }),
        [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions/rev1/files/conan_export.tgz`]: () =>
          tgzResponse('export/diff.metadata.json', fragment('LinkEth', '1.0.0'))
      }),
      cache: memoryCache()
    })
    const result = await source.loadCatalog()
    if (result.status !== 'ready') throw new Error('expected ready')
    expect(result.catalog.components[0].type).toBe('LinkEth')
  })

  it('stamps source on every fetched component from the configured repo URL', async () => {
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: routedFetch({
        [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: ['linketh/1.0.0@noembedded/stable'] }),
        [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions`]: () =>
          jsonResponse({ revisions: [{ revision: 'rev1', time: '2026-04-25T10:00:00Z' }] }),
        [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions/rev1/files/conan_export.tgz`]: () =>
          tgzResponse('diff.metadata.json', fragment('LinkEth', '1.0.0'))
      }),
      cache: memoryCache()
    })
    const result = await source.loadCatalog()
    if (result.status !== 'ready') throw new Error('expected ready')
    expect(result.catalog.components[0].source).toBe(STORAGE_URL)
  })

  it('inserts /api/conan/ when a storage URL is given', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: [] })
    })
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: fetchFn,
      cache: memoryCache()
    })
    await source.loadCatalog()
    expect(fetchFn.mock.calls[0][0]).toBe(`${API_BASE}/v2/conans/search?q=*`)
  })

  it('uses the URL as-is when /api/conan/ is already present', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: [] })
    })
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: API_BASE },
      fetch: fetchFn,
      cache: memoryCache()
    })
    await source.loadCatalog()
    expect(fetchFn.mock.calls[0][0]).toBe(`${API_BASE}/v2/conans/search?q=*`)
  })

  it('trims trailing slashes from the repo URL before deriving the API base', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: [] })
    })
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: `${STORAGE_URL}/` },
      fetch: fetchFn,
      cache: memoryCache()
    })
    await source.loadCatalog()
    expect(fetchFn.mock.calls[0][0]).toBe(`${API_BASE}/v2/conans/search?q=*`)
  })
})

describe('createArtifactoryCatalogSource - failures (no cache)', () => {
  it('returns error when the only repo fails on the search endpoint and no cache exists', async () => {
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: vi.fn(async () => errorResponse(404, 'Not Found')),
      cache: memoryCache()
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('error')
    if (result.status !== 'error') return
    expect(result.repos[0].status).toBe('failed')
    if (result.repos[0].status !== 'failed') return
    expect(result.repos[0].reason).toContain('404')
  })

  it('returns error when the tarball download fails and no cache exists', async () => {
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: routedFetch({
        [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: ['linketh/1.0.0@noembedded/stable'] }),
        [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions`]: () =>
          jsonResponse({ revisions: [{ revision: 'rev1' }] })
      }),
      cache: memoryCache()
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('error')
    if (result.status !== 'error') return
    expect(result.repos[0].status).toBe('failed')
    if (result.repos[0].status !== 'failed') return
    expect(result.repos[0].reason).toContain('conan_export.tgz')
  })

  it('returns error when diff.metadata.json is missing from the tarball and no cache exists', async () => {
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: routedFetch({
        [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: ['linketh/1.0.0@noembedded/stable'] }),
        [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions`]: () =>
          jsonResponse({ revisions: [{ revision: 'rev1' }] }),
        [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions/rev1/files/conan_export.tgz`]: () =>
          tgzResponse('something_else.txt', { not: 'metadata' })
      }),
      cache: memoryCache()
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('error')
    if (result.status !== 'error') return
    if (result.repos[0].status !== 'failed') return
    expect(result.repos[0].reason).toContain('not found inside conan_export.tgz')
  })

  it('flags 401 with a token-rejected hint when token is provided', async () => {
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL, DF_ARTIFACTORY_TOKEN: 'expired' },
      fetch: vi.fn(async () => errorResponse(401, 'Unauthorized')),
      cache: memoryCache()
    })
    const result = await source.loadCatalog()
    if (result.status !== 'error') throw new Error('expected error')
    if (result.repos[0].status !== 'failed') throw new Error('expected failed')
    expect(result.repos[0].reason).toContain('token rejected or expired')
  })

  it('flags 401 with a token-missing hint when no token', async () => {
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: vi.fn(async () => errorResponse(401, 'Unauthorized')),
      cache: memoryCache()
    })
    const result = await source.loadCatalog()
    if (result.status !== 'error') throw new Error('expected error')
    if (result.repos[0].status !== 'failed') throw new Error('expected failed')
    expect(result.repos[0].reason).toContain('token missing')
  })

  it('sends Authorization header when token is provided', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: [] })
    })
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL, DF_ARTIFACTORY_TOKEN: 'secret-token' },
      fetch: fetchFn,
      cache: memoryCache()
    })
    await source.loadCatalog()
    const init = fetchFn.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer secret-token')
  })

  it('does not send Authorization header when token is null', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: [] })
    })
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: fetchFn,
      cache: memoryCache()
    })
    await source.loadCatalog()
    const init = fetchFn.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })
})

describe('createArtifactoryCatalogSource - per-repo cache', () => {
  const cachedDoc: CatalogDocument = {
    schema: 'diff.catalog.v1',
    components: [
      {
        type: 'LinkEth',
        version: '1.0.0',
        source: STORAGE_URL,
        implements: ['ILink'],
        requires: [],
        configSchema: {}
      }
    ]
  }

  it('writes per-repo cache on successful fetch', async () => {
    const cache = memoryCache()
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: routedFetch(standardRoutes),
      cache
    })
    await source.loadCatalog()
    expect(cache.store.has(STORAGE_URL)).toBe(true)
    const stored = cache.store.get(STORAGE_URL)!
    expect(stored.components.map((c) => c.type).sort()).toEqual(['LinkEth', 'LinkGsm'])
  })

  it('falls back to cached catalog as stale when fetch fails and cache exists', async () => {
    const cache = memoryCache({ [STORAGE_URL]: cachedDoc })
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: vi.fn(async () => errorResponse(500, 'Server Error')),
      cache
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('partial')
    if (result.status !== 'partial') return
    expect(result.repos[0].status).toBe('stale')
    if (result.repos[0].status !== 'stale') return
    expect(result.repos[0].reason).toContain('500')
    expect(result.catalog.components.map((c) => c.type)).toEqual(['LinkEth'])
    expect(result.message).toContain('cached')
  })

  it('returns failed when fetch fails and no cache exists for that repo', async () => {
    const cache = memoryCache()
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: vi.fn(async () => errorResponse(500, 'Server Error')),
      cache
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('error')
    if (result.status !== 'error') return
    expect(result.repos[0].status).toBe('failed')
  })

  it('overwrites existing cache on successful refresh', async () => {
    const cache = memoryCache({ [STORAGE_URL]: cachedDoc })
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: STORAGE_URL },
      fetch: routedFetch(standardRoutes),
      cache
    })
    await source.loadCatalog()
    const stored = cache.store.get(STORAGE_URL)!
    expect(stored.components.map((c) => c.type).sort()).toEqual(['LinkEth', 'LinkGsm'])
  })
})

describe('createArtifactoryCatalogSource - multi-repo aggregation', () => {
  const REPO_A = 'https://art.example/artifactory/repoA'
  const REPO_B = 'https://art.example/artifactory/repoB'
  const apiA = 'https://art.example/artifactory/api/conan/repoA'
  const apiB = 'https://art.example/artifactory/api/conan/repoB'

  function repoARoutes(): Routes {
    return {
      [`${apiA}/v2/conans/search?q=*`]: () => jsonResponse({ results: ['linketh/1.0.0@noembedded/stable'] }),
      [`${apiA}/v2/conans/linketh/1.0.0/noembedded/stable/revisions`]: () =>
        jsonResponse({ revisions: [{ revision: 'rev1' }] }),
      [`${apiA}/v2/conans/linketh/1.0.0/noembedded/stable/revisions/rev1/files/conan_export.tgz`]: () =>
        tgzResponse('diff.metadata.json', fragment('LinkEth', '1.0.0'))
    }
  }

  it('returns partial when some repos succeed and some fail without cache', async () => {
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: `${REPO_A},${REPO_B}` },
      fetch: routedFetch({
        ...repoARoutes(),
        [`${apiB}/v2/conans/search?q=*`]: () => errorResponse(500, 'Server Error')
      }),
      cache: memoryCache()
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('partial')
    if (result.status !== 'partial') return
    expect(result.catalog.components).toHaveLength(1)
    expect(result.repos.map((r) => r.url)).toEqual([REPO_A, REPO_B])
    expect(result.repos.find((r) => r.url === REPO_A)?.status).toBe('ok')
    expect(result.repos.find((r) => r.url === REPO_B)?.status).toBe('failed')
  })

  it('returns partial with stale + ok when one repo fails but has cache, other succeeds', async () => {
    const cachedDocB: CatalogDocument = {
      schema: 'diff.catalog.v1',
      components: [
        {
          type: 'LinkGsm',
          version: '1.0.0',
          source: REPO_B,
          implements: ['ILink'],
          requires: [],
          configSchema: {}
        }
      ]
    }
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: `${REPO_A},${REPO_B}` },
      fetch: routedFetch({
        ...repoARoutes(),
        [`${apiB}/v2/conans/search?q=*`]: () => errorResponse(500, 'Server Error')
      }),
      cache: memoryCache({ [REPO_B]: cachedDocB })
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('partial')
    if (result.status !== 'partial') return
    expect(result.catalog.components.map((c) => c.type).sort()).toEqual(['LinkEth', 'LinkGsm'])
    expect(result.repos.find((r) => r.url === REPO_A)?.status).toBe('ok')
    expect(result.repos.find((r) => r.url === REPO_B)?.status).toBe('stale')
    expect(result.message).toContain('cached')
  })

  it('returns error when all repos fail and none have cache', async () => {
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: 'https://a.example/conan,https://b.example/conan' },
      fetch: vi.fn(async () => errorResponse(500, 'Server Error')),
      cache: memoryCache()
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('error')
    if (result.status !== 'error') return
    expect(result.message).toContain('2 repositories failed')
    expect(result.repos).toHaveLength(2)
    expect(result.repos.every((r) => r.status === 'failed')).toBe(true)
  })

  it('returns partial when all repos fail but all have cache', async () => {
    const docA: CatalogDocument = {
      schema: 'diff.catalog.v1',
      components: [
        {
          type: 'LinkEth',
          version: '1.0.0',
          source: REPO_A,
          implements: ['ILink'],
          requires: [],
          configSchema: {}
        }
      ]
    }
    const docB: CatalogDocument = {
      schema: 'diff.catalog.v1',
      components: [
        {
          type: 'LinkGsm',
          version: '1.0.0',
          source: REPO_B,
          implements: ['ILink'],
          requires: [],
          configSchema: {}
        }
      ]
    }
    const source = createArtifactoryCatalogSource({
      env: { DF_ARTIFACTORY_REPOS: `${REPO_A},${REPO_B}` },
      fetch: vi.fn(async () => errorResponse(500, 'Server Error')),
      cache: memoryCache({ [REPO_A]: docA, [REPO_B]: docB })
    })
    const result = await source.loadCatalog()
    expect(result.status).toBe('partial')
    if (result.status !== 'partial') return
    expect(result.repos.every((r) => r.status === 'stale')).toBe(true)
    expect(result.catalog.components.map((c) => c.type).sort()).toEqual(['LinkEth', 'LinkGsm'])
  })
})
