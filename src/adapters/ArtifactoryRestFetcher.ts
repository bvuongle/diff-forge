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
          return failed(repo, `_index.json: HTTP ${indexResp.status} ${indexResp.statusText}`)
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
        return {
          status: 'ok',
          slug: repo.slug,
          url: repo.url,
          catalog,
          fetchedAt: new Date().toISOString()
        }
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
    throw new Error(`${target.label}: HTTP ${resp.status} ${resp.statusText}`)
  }
  const fragment = ComponentFragmentZ.parse(await resp.json())
  return fragmentToComponent(fragment)
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
