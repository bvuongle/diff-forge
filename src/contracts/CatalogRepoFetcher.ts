import type { CatalogDocument } from '@core/catalog/CatalogSchema'
import type { RepoConfig } from '@core/catalog/envRepos'

type RepoFetchResult =
  | { status: 'ok'; url: string; catalog: CatalogDocument }
  | { status: 'failed'; url: string; reason: string }

type CatalogRepoFetcher = {
  fetch(repo: RepoConfig, token: string | null): Promise<RepoFetchResult>
}

export type { CatalogRepoFetcher, RepoFetchResult }
