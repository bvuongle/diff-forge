import { describe, expect, it, vi } from 'vitest'

import { createArtifactoryRestFetcher } from './ArtifactoryRestFetcher'

const repo = { url: 'https://art.example/artifactory/diff/diff-forge-catalog/core' }

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

describe('createArtifactoryRestFetcher', () => {
  it('returns ok with merged components on a full successful fetch', async () => {
    const fetchFn = vi.fn(async (url: RequestInfo | URL, _init?: RequestInit) => {
      const u = String(url)
      if (u.endsWith('/_index.json')) {
        return jsonResponse({
          schema: 'diff.catalog.index.v2',
          repo: 'core',
          components: [
            { source: 'diff_broker', type: 'LinkEth', versions: ['1.0.0'] },
            { source: 'diff_broker', type: 'LinkGsm', versions: ['1.0.0', '1.1.0'] }
          ]
        })
      }
      if (u.endsWith('/diff_broker/1.0.0/LinkEth/metadata.json')) {
        return jsonResponse({
          schema: 'diff.component.v2',
          type: 'LinkEth',
          source: 'diff_broker',
          version: '1.0.0',
          implements: ['ILink'],
          requires: [],
          configSchema: {}
        })
      }
      if (u.endsWith('/diff_broker/1.0.0/LinkGsm/metadata.json')) {
        return jsonResponse({
          schema: 'diff.component.v2',
          type: 'LinkGsm',
          source: 'diff_broker',
          version: '1.0.0',
          implements: ['ILink'],
          requires: [],
          configSchema: {}
        })
      }
      if (u.endsWith('/diff_broker/1.1.0/LinkGsm/metadata.json')) {
        return jsonResponse({
          schema: 'diff.component.v2',
          type: 'LinkGsm',
          source: 'diff_broker',
          version: '1.1.0',
          implements: ['ILink'],
          requires: [],
          configSchema: {}
        })
      }
      return errorResponse(404)
    })

    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, null)

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.catalog.components).toHaveLength(3)
    expect(result.catalog.schema).toBe('diff.catalog.v1')
    expect(result.catalog.components.map((c) => `${c.type}@${c.version}`)).toEqual([
      'LinkEth@1.0.0',
      'LinkGsm@1.0.0',
      'LinkGsm@1.1.0'
    ])
  })

  it('returns failed when index fetch returns non-2xx', async () => {
    const fetchFn = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => errorResponse(404, 'Not Found'))
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, null)
    expect(result.status).toBe('failed')
    if (result.status !== 'failed') return
    expect(result.reason).toContain('_index.json')
    expect(result.reason).toContain('404')
  })

  it('returns failed when a fragment fetch returns non-2xx', async () => {
    const fetchFn = vi.fn(async (url: RequestInfo | URL, _init?: RequestInit) => {
      return String(url).endsWith('/_index.json')
        ? jsonResponse({
            schema: 'diff.catalog.index.v2',
            components: [{ source: 'diff_broker', type: 'LinkEth', versions: ['1.0.0'] }]
          })
        : errorResponse(403, 'Forbidden')
    })
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, null)
    expect(result.status).toBe('failed')
    if (result.status !== 'failed') return
    expect(result.reason).toContain('LinkEth@1.0.0')
    expect(result.reason).toContain('403')
  })

  it('flags 401 on index with a token-rejected hint when token is provided', async () => {
    const fetchFn = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => errorResponse(401, 'Unauthorized'))
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, 'expired-token')
    expect(result.status).toBe('failed')
    if (result.status !== 'failed') return
    expect(result.reason).toContain('401')
    expect(result.reason).toContain('token rejected or expired')
  })

  it('flags 401 on index with a token-missing hint when no token', async () => {
    const fetchFn = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => errorResponse(401, 'Unauthorized'))
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, null)
    expect(result.status).toBe('failed')
    if (result.status !== 'failed') return
    expect(result.reason).toContain('401')
    expect(result.reason).toContain('token missing')
  })

  it('flags 403 on a fragment with the same auth hint', async () => {
    const fetchFn = vi.fn(async (url: RequestInfo | URL, _init?: RequestInit) => {
      return String(url).endsWith('/_index.json')
        ? jsonResponse({
            schema: 'diff.catalog.index.v2',
            components: [{ source: 'diff_broker', type: 'LinkEth', versions: ['1.0.0'] }]
          })
        : errorResponse(403, 'Forbidden')
    })
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, 'expired-token')
    expect(result.status).toBe('failed')
    if (result.status !== 'failed') return
    expect(result.reason).toContain('LinkEth@1.0.0')
    expect(result.reason).toContain('403')
    expect(result.reason).toContain('token rejected or expired')
  })

  it('returns failed when the index body fails schema validation', async () => {
    const fetchFn = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({ schema: 'wrong.schema', components: [] })
    )
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    const result = await fetcher.fetch(repo, null)
    expect(result.status).toBe('failed')
  })

  it('sends Authorization header when token is provided', async () => {
    const fetchFn = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({ schema: 'diff.catalog.index.v2', components: [] })
    )
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    await fetcher.fetch(repo, 'secret-token')

    const init = fetchFn.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer secret-token')
  })

  it('does not send Authorization header when token is null', async () => {
    const fetchFn = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({ schema: 'diff.catalog.index.v2', components: [] })
    )
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    await fetcher.fetch(repo, null)

    const init = fetchFn.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it('trims trailing slashes from the repo URL', async () => {
    const fetchFn = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({ schema: 'diff.catalog.index.v2', components: [] })
    )
    const fetcher = createArtifactoryRestFetcher({ fetch: fetchFn })
    await fetcher.fetch({ url: 'https://art.example/core/' }, null)

    expect(fetchFn.mock.calls[0][0]).toBe('https://art.example/core/_index.json')
  })
})
