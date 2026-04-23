import type { CatalogDocument } from '@domain/catalog/CatalogSchema'

type RepoFetchRecord = {
  slug: string
  url: string
  state:
    | { status: 'fresh'; fetchedAt: string }
    | { status: 'stale'; fetchedAt: string; reason: string }
    | { status: 'failed'; reason: string }
}

type CacheSnapshot = {
  merged: CatalogDocument | null
  repos: RepoFetchRecord[]
}

interface CatalogCache {
  read(): Promise<CacheSnapshot>
  writeMerged(catalog: CatalogDocument): Promise<void>
  writeRepos(records: RepoFetchRecord[]): Promise<void>
}

export type { CatalogCache, CacheSnapshot, RepoFetchRecord }
