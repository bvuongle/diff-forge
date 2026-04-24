import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

import { CatalogDocumentZ, type CatalogDocument } from '@domain/catalog/CatalogSchema'
import type { CacheSnapshot, CatalogCache, RepoFetchRecord } from '@contracts/CatalogCache'

type FsCatalogCacheDeps = {
  baseDir: string
}

// NOTE: subfolder is 'catalog-cache' (not 'cache') because Electron manages a
// 'Cache/' folder under userData for its HTTP cache, and macOS is case-insensitive
// so 'cache' and 'Cache' collide. Electron wipes unknown files in that dir on boot.
function createFsCatalogCache(deps: FsCatalogCacheDeps): CatalogCache {
  const mergedPath = path.join(deps.baseDir, 'catalog-cache', 'merged.json')
  const metaPath = path.join(deps.baseDir, 'catalog-cache', 'meta.json')

  async function ensureDir(): Promise<void> {
    await mkdir(path.dirname(mergedPath), { recursive: true })
  }

  return {
    async read(): Promise<CacheSnapshot> {
      await ensureDir()
      const [merged, repos] = await Promise.all([readMerged(mergedPath), readRepos(metaPath)])
      return { merged, repos }
    },
    async writeMerged(catalog: CatalogDocument): Promise<void> {
      await ensureDir()
      await writeFile(mergedPath, JSON.stringify(catalog, null, 2), 'utf8')
    },
    async writeRepos(records: RepoFetchRecord[]): Promise<void> {
      await ensureDir()
      await writeFile(metaPath, JSON.stringify({ version: 1, repos: records }, null, 2), 'utf8')
    }
  }
}

async function readMerged(target: string): Promise<CatalogDocument | null> {
  const body = await readOptional(target)
  if (body === null) return null
  try {
    return CatalogDocumentZ.parse(JSON.parse(body))
  } catch {
    return null
  }
}

type LegacyRepoRecord = {
  slug: string
  url: string
  state: { status: string; reason?: string }
}

async function readRepos(target: string): Promise<RepoFetchRecord[]> {
  const body = await readOptional(target)
  if (body === null) return []
  try {
    const parsed = JSON.parse(body) as { version?: number; repos?: LegacyRepoRecord[] }
    if (parsed?.version === 1 && Array.isArray(parsed.repos)) {
      return parsed.repos.map(normalizeRecord)
    }
  } catch {
    return []
  }
  return []
}

// Legacy records from pre-simplification used { status: 'fresh', fetchedAt } / 'stale'.
// Both now collapse to { status: 'ok' }; 'failed' is preserved with its reason.
function normalizeRecord(record: LegacyRepoRecord): RepoFetchRecord {
  if (record.state.status === 'failed') {
    return { slug: record.slug, url: record.url, state: { status: 'failed', reason: record.state.reason ?? '' } }
  }
  return { slug: record.slug, url: record.url, state: { status: 'ok' } }
}

async function readOptional(target: string): Promise<string | null> {
  try {
    return await readFile(target, 'utf8')
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw err
  }
}

export { createFsCatalogCache }
