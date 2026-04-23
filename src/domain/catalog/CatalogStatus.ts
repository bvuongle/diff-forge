import type { CatalogDocument } from './CatalogSchema'

type RepoFetchState =
  | { status: 'fresh'; fetchedAt: string }
  | { status: 'stale'; fetchedAt: string; reason: string }
  | { status: 'failed'; reason: string }

type RepoSummary = {
  url: string
  slug: string
  state: RepoFetchState
}

type CatalogStatus =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  | { status: 'ready'; catalog: CatalogDocument; repos: RepoSummary[] }
  | { status: 'partial'; catalog: CatalogDocument; repos: RepoSummary[]; message: string }
  | { status: 'error'; message: string; repos: RepoSummary[] }

export type { CatalogStatus, RepoSummary, RepoFetchState }
