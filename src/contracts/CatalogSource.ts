import type { CatalogDocument } from '@core/catalog/CatalogSchema'

type RepoLoadResult =
  | { url: string; status: 'ok' }
  | { url: string; status: 'stale'; reason: string }
  | { url: string; status: 'failed'; reason: string }

type CatalogLoadResult =
  | { status: 'ready'; catalog: CatalogDocument; repos: RepoLoadResult[] }
  | { status: 'partial'; catalog: CatalogDocument; repos: RepoLoadResult[]; message: string }
  | { status: 'unconfigured'; missing: string[] }
  | { status: 'error'; message: string; repos: RepoLoadResult[] }

type CatalogSource = {
  loadCatalog(): Promise<CatalogLoadResult>
}

export type { CatalogSource, CatalogLoadResult, RepoLoadResult }
