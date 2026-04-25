import type { CatalogDocument } from '@domain/catalog/CatalogSchema'

type RepoFetchRecord = {
  url: string
  state: { status: 'ok' } | { status: 'failed'; reason: string }
}

type CacheSnapshot = {
  merged: CatalogDocument | null
  repos: RepoFetchRecord[]
}

type CatalogCache = {
  read(): Promise<CacheSnapshot>
  writeMerged(catalog: CatalogDocument): Promise<void>
  writeRepos(records: RepoFetchRecord[]): Promise<void>
}

export type { CatalogCache, CacheSnapshot, RepoFetchRecord }
