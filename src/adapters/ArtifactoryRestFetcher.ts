import type { CatalogComponent, CatalogDocument } from '@domain/catalog/CatalogSchema'
import { CatalogIndexZ, ComponentFragmentZ, fragmentToComponent } from '@domain/catalog/CatalogWireSchema'
import type { CatalogRepoFetcher, RepoFetchResult } from '@contracts/CatalogRepoFetcher'

type FetchFn = typeof fetch

type Deps = { fetch: FetchFn }

function createArtifactoryRestFetcher(deps: Deps): CatalogRepoFetcher {
  return {
    async fetch(repo, token) {
      const base = trimSlash(repo.url)
      try {
        const indexResp = await request(deps.fetch, `${base}/_index.json`, token)
        if (!indexResp.ok) {
          return failed(repo, describeHttpFailure('_index.json', indexResp, token))
        }
        const index = CatalogIndexZ.parse(await indexResp.json())

        const targets = index.components.flatMap((entry) =>
          entry.versions.map((version) => ({
            url: `${base}/${entry.source}/${version}/${entry.type}/metadata.json`,
            label: `${entry.source}/${entry.type}@${version}`
          }))
        )

        const components = await Promise.all(targets.map((target) => fetchFragment(deps.fetch, target, token)))

        const catalog: CatalogDocument = { schema: 'diff.catalog.v1', components }
        return { status: 'ok', slug: repo.slug, url: repo.url, catalog }
      } catch (err) {
        return failed(repo, err instanceof Error ? err.message : String(err))
      }
    }
  }
}

async function fetchFragment(
  fetchFn: FetchFn,
  target: { url: string; label: string },
  token: string | null
): Promise<CatalogComponent> {
  const resp = await request(fetchFn, target.url, token)
  if (!resp.ok) {
    throw new Error(describeHttpFailure(target.label, resp, token))
  }
  const fragment = ComponentFragmentZ.parse(await resp.json())
  return fragmentToComponent(fragment)
}

function describeHttpFailure(label: string, resp: Response, token: string | null): string {
  if (resp.status === 401 || resp.status === 403) {
    const hint = token ? 'token rejected or expired' : 'token missing'
    return `${label}: HTTP ${resp.status} - ${hint}`
  }
  return `${label}: HTTP ${resp.status} ${resp.statusText}`
}

function request(fetchFn: FetchFn, url: string, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetchFn(url, { headers })
}

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '')
}

function failed(repo: { slug: string; url: string }, reason: string): Extract<RepoFetchResult, { status: 'failed' }> {
  return { status: 'failed', slug: repo.slug, url: repo.url, reason }
}

export { createArtifactoryRestFetcher }
