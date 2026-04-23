import type { CatalogDocument } from '@domain/catalog/CatalogSchema'
import type { RepoConfig } from '@domain/catalog/envRepos'

type RepoFetchResult =
  | { status: 'ok'; slug: string; url: string; catalog: CatalogDocument; fetchedAt: string }
  | { status: 'failed'; slug: string; url: string; reason: string }

interface CatalogRepoFetcher {
  fetch(repo: RepoConfig, token: string | null): Promise<RepoFetchResult>
}

export type { CatalogRepoFetcher, RepoFetchResult }
