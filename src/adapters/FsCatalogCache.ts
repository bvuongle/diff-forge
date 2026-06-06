import { createHash } from 'crypto'
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises'
import path from 'path'

import { CatalogComponentZ, type CatalogComponent, type CatalogDocument } from '@core/catalog/CatalogSchema'
import type { CatalogCache } from '@contracts/CatalogCache'

type FsCatalogCacheDeps = {
  baseDir: string
}

function createFsCatalogCache(deps: FsCatalogCacheDeps): CatalogCache {
  const rootDir = path.join(deps.baseDir, 'catalog-cache')

  function repoDir(sourceUrl: string): string {
    const key = createHash('sha1').update(normalizeUrl(sourceUrl)).digest('hex')
    return path.join(rootDir, key)
  }

  function componentFile(component: CatalogComponent): string {
    const name = `${sanitize(component.type)}@${sanitize(component.version)}.json`
    return path.join(repoDir(component.source), name)
  }

  return {
    async writeCache(component) {
      const dir = repoDir(component.source)
      await mkdir(dir, { recursive: true })
      await writeFile(componentFile(component), JSON.stringify(component, null, 2), 'utf8')
    },

    async readCache() {
      const repoDirs = await listOptional(rootDir)
      if (repoDirs === null) return null
      const components: CatalogComponent[] = []
      for (const entry of repoDirs) {
        const dir = path.join(rootDir, entry)
        const files = await listOptional(dir)
        if (files === null) continue
        for (const file of files) {
          if (!file.endsWith('.json')) continue
          const fullPath = path.join(dir, file)
          const body = await readOptional(fullPath)
          if (body === null) continue
          const parsed = parseComponent(body)
          if (parsed.ok) {
            components.push(parsed.component)
          } else {
            // eslint-disable-next-line no-console -- main-process adapter; stderr is the right channel
            console.warn(
              `FsCatalogCache: skipping ${fullPath} (${parsed.reason}); file will be replaced on next refresh`
            )
          }
        }
      }
      if (components.length === 0) return null
      return { components } satisfies CatalogDocument
    },

    async clearRepo(sourceUrl) {
      await rm(repoDir(sourceUrl), { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
    },

    async clear() {
      await rm(rootDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
    }
  }
}

type ParseResult = { ok: true; component: CatalogComponent } | { ok: false; reason: string }

function parseComponent(body: string): ParseResult {
  let json: unknown
  try {
    json = JSON.parse(body)
  } catch (err) {
    return { ok: false, reason: `invalid JSON: ${err instanceof Error ? err.message : String(err)}` }
  }
  const result = CatalogComponentZ.safeParse(json)
  if (!result.success) {
    return { ok: false, reason: `schema mismatch: ${result.error.issues[0]?.message ?? 'unknown'}` }
  }
  return { ok: true, component: result.data }
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '').toLowerCase()
}

function sanitize(s: string): string {
  return s.replace(/[/\\:?*"<>|]/g, '_')
}

async function listOptional(target: string): Promise<string[] | null> {
  try {
    return await readdir(target)
  } catch (err) {
    const code = err instanceof Error && 'code' in err ? (err as NodeJS.ErrnoException).code : ''
    if (code === 'ENOENT' || code === 'ENOTDIR') return null
    throw err
  }
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
