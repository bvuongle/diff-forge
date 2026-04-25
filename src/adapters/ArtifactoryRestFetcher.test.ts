import { gzipSync } from 'node:zlib'

import { describe, expect, it, vi } from 'vitest'

import { createArtifactoryRestFetcher } from './ArtifactoryRestFetcher'

const STORAGE_URL = 'https://art.example/artifactory/diff'
const API_BASE = 'https://art.example/artifactory/api/conan/diff'
const repo = { url: STORAGE_URL }

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

describe('createArtifactoryRestFetcher', () => {
  it('returns ok with merged components on a full successful fetch', async () => {
    const fetchFn = routedFetch({
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
    })

    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, null)

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.catalog.components.map((c) => `${c.type}@${c.version}`).sort()).toEqual([
      'LinkEth@1.0.0',
      'LinkGsm@1.0.0'
    ])
  })

  it('extracts metadata even when tarball nests it under a folder', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: ['linketh/1.0.0@noembedded/stable'] }),
      [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions`]: () =>
        jsonResponse({ revisions: [{ revision: 'rev1' }] }),
      [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions/rev1/files/conan_export.tgz`]: () =>
        tgzResponse('export/diff.metadata.json', fragment('LinkEth', '1.0.0'))
    })
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, null)

    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.catalog.components[0].type).toBe('LinkEth')
  })

  it('stamps source on every fetched component from the configured repo URL', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: ['linketh/1.0.0@noembedded/stable'] }),
      [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions`]: () =>
        jsonResponse({ revisions: [{ revision: 'rev1', time: '2026-04-25T10:00:00Z' }] }),
      [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions/rev1/files/conan_export.tgz`]: () =>
        tgzResponse('diff.metadata.json', fragment('LinkEth', '1.0.0'))
    })
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, null)

    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.catalog.components[0].source).toBe(STORAGE_URL)
  })

  it('inserts /api/conan/ when a storage URL is given', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: [] })
    })
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    await fetcher.fetch(repo, null)
    expect(fetchFn.mock.calls[0][0]).toBe(`${API_BASE}/v2/conans/search?q=*`)
  })

  it('uses the URL as-is when /api/conan/ is already present', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: [] })
    })
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    await fetcher.fetch({ url: API_BASE }, null)
    expect(fetchFn.mock.calls[0][0]).toBe(`${API_BASE}/v2/conans/search?q=*`)
  })

  it('returns failed when the search endpoint returns non-2xx', async () => {
    const fetchFn = vi.fn(async () => errorResponse(404, 'Not Found'))
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, null)

    expect(result.status).toBe('failed')
    if (result.status !== 'failed') return
    expect(result.reason).toContain('catalog list')
    expect(result.reason).toContain('404')
    expect(result.reason).toContain(`${API_BASE}/v2/conans/search?q=*`)
  })

  it('returns failed when the export tarball download returns non-2xx', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: ['linketh/1.0.0@noembedded/stable'] }),
      [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions`]: () =>
        jsonResponse({ revisions: [{ revision: 'rev1' }] })
    })
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, null)

    expect(result.status).toBe('failed')
    if (result.status !== 'failed') return
    expect(result.reason).toContain('linketh')
    expect(result.reason).toContain('404')
    expect(result.reason).toContain('conan_export.tgz')
  })

  it('returns failed when diff.metadata.json is not inside the tarball', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: ['linketh/1.0.0@noembedded/stable'] }),
      [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions`]: () =>
        jsonResponse({ revisions: [{ revision: 'rev1' }] }),
      [`${API_BASE}/v2/conans/linketh/1.0.0/noembedded/stable/revisions/rev1/files/conan_export.tgz`]: () =>
        tgzResponse('something_else.txt', { not: 'metadata' })
    })
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, null)

    expect(result.status).toBe('failed')
    if (result.status !== 'failed') return
    expect(result.reason).toContain('not found inside conan_export.tgz')
  })

  it('flags 401 with a token-rejected hint when token is provided', async () => {
    const fetchFn = vi.fn(async () => errorResponse(401, 'Unauthorized'))
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, 'expired-token')

    expect(result.status).toBe('failed')
    if (result.status !== 'failed') return
    expect(result.reason).toContain('401')
    expect(result.reason).toContain('token rejected or expired')
  })

  it('flags 401 with a token-missing hint when no token', async () => {
    const fetchFn = vi.fn(async () => errorResponse(401, 'Unauthorized'))
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, null)

    expect(result.status).toBe('failed')
    if (result.status !== 'failed') return
    expect(result.reason).toContain('401')
    expect(result.reason).toContain('token missing')
  })

  it('sends Authorization header when token is provided', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: [] })
    })
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    await fetcher.fetch(repo, 'secret-token')

    const init = fetchFn.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer secret-token')
  })

  it('does not send Authorization header when token is null', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: [] })
    })
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    await fetcher.fetch(repo, null)

    const init = fetchFn.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it('trims trailing slashes from the repo URL before deriving the API base', async () => {
    const fetchFn = routedFetch({
      [`${API_BASE}/v2/conans/search?q=*`]: () => jsonResponse({ results: [] })
    })
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    await fetcher.fetch({ url: `${STORAGE_URL}/` }, null)

    expect(fetchFn.mock.calls[0][0]).toBe(`${API_BASE}/v2/conans/search?q=*`)
  })
})
