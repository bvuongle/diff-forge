import type { CatalogDocument } from '@core/catalog/CatalogSchema'

type RepoLoadOutcome =
  | { url: string; status: 'ok' }
  | { url: string; status: 'stale'; reason: string }
  | { url: string; status: 'failed'; reason: string }

type CatalogLoadOutcome =
  | { status: 'ready'; catalog: CatalogDocument; repos: RepoLoadOutcome[] }
  | { status: 'partial'; catalog: CatalogDocument; repos: RepoLoadOutcome[]; message: string }
  | { status: 'unconfigured'; missing: string[] }
  | { status: 'error'; message: string; repos: RepoLoadOutcome[] }

type CatalogSource = {
  loadCatalog(): Promise<CatalogLoadOutcome>
}

export type { CatalogSource, CatalogLoadOutcome, RepoLoadOutcome }
