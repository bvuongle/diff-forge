import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

import { CatalogDocumentZ, type CatalogDocument } from '@domain/catalog/CatalogSchema'
import type { CacheSnapshot, CatalogCache, RepoFetchRecord } from '@contracts/CatalogCache'

type FsCatalogCacheDeps = {
  baseDir: string
}

function createFsCatalogCache(deps: FsCatalogCacheDeps): CatalogCache {
  const mergedPath = path.join(deps.baseDir, 'cache', 'merged.json')
  const metaPath = path.join(deps.baseDir, 'cache', 'meta.json')

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

async function readRepos(target: string): Promise<RepoFetchRecord[]> {
  const body = await readOptional(target)
  if (body === null) return []
  try {
    const parsed = JSON.parse(body) as { version?: number; repos?: RepoFetchRecord[] }
    if (parsed?.version === 1 && Array.isArray(parsed.repos)) return parsed.repos
  } catch {
    // fall through
  }
  return []
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
