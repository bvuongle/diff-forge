import { createHash } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

import { CatalogDocumentZ, type CatalogDocument } from '@core/catalog/CatalogSchema'
import type { CatalogCache } from '@contracts/CatalogCache'

type FsCatalogCacheDeps = {
  baseDir: string
}

function createFsCatalogCache(deps: FsCatalogCacheDeps): CatalogCache {
  const reposDir = path.join(deps.baseDir, 'catalog-cache', 'repos')

  async function ensureDir(): Promise<void> {
    await mkdir(reposDir, { recursive: true })
  }

  function repoPath(url: string): string {
    const key = createHash('sha1').update(normalizeUrl(url)).digest('hex')
    return path.join(reposDir, `${key}.json`)
  }

  return {
    async readRepo(url: string): Promise<CatalogDocument | null> {
      await ensureDir()
      const body = await readOptional(repoPath(url))
      if (body === null) return null
      try {
        return CatalogDocumentZ.parse(JSON.parse(body))
      } catch {
        return null
      }
    },
    async writeRepo(url: string, catalog: CatalogDocument): Promise<void> {
      await ensureDir()
      await writeFile(repoPath(url), JSON.stringify(catalog, null, 2), 'utf8')
    }
  }
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '').toLowerCase()
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
