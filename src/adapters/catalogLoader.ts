import { CatalogDocumentZ, type CatalogDocument } from '@core/catalog/CatalogSchema'

import type { CatalogLoadOutcome, RepoSummaryDto } from '@/electron/electronApi'

type CatalogLoadResult =
  | { status: 'unavailable' }
  | { status: 'unconfigured'; missing: string[] }
  | { status: 'ready'; catalog: CatalogDocument; repos: RepoSummaryDto[] }
  | { status: 'partial'; catalog: CatalogDocument; repos: RepoSummaryDto[]; message: string }
  | { status: 'error'; message: string; repos: RepoSummaryDto[] }

async function loadCatalog(): Promise<CatalogLoadResult> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    return { status: 'unavailable' }
  }
  return handleOutcome(await window.electronAPI.catalog.load())
}

async function refreshCatalog(): Promise<CatalogLoadResult> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    return { status: 'unavailable' }
  }
  return handleOutcome(await window.electronAPI.catalog.refresh())
}

function handleOutcome(outcome: CatalogLoadOutcome): CatalogLoadResult {
  if (outcome.status === 'unconfigured') {
    return { status: 'unconfigured', missing: outcome.missing }
  }
  if (outcome.status === 'error') {
    return { status: 'error', message: outcome.message, repos: outcome.repos }
  }
  try {
    const parsed = CatalogDocumentZ.parse(JSON.parse(outcome.catalog))
    if (outcome.status === 'partial') {
      return { status: 'partial', catalog: parsed, repos: outcome.repos, message: outcome.message }
    }
    return { status: 'ready', catalog: parsed, repos: outcome.repos }
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Cached catalog is malformed',
      repos: outcome.repos
    }
  }
}

export { loadCatalog, refreshCatalog }
export type { CatalogLoadResult }
