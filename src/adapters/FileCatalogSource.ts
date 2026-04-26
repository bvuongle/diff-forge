import { CatalogDocumentZ } from '@core/catalog/CatalogSchema'
import type { CatalogLoadOutcome, CatalogSource } from '@contracts/CatalogSource'

const CATALOG_FILE = 'DF_CATALOG_FILE'

type ReadFileFn = (path: string) => Promise<string>

type FileCatalogSourceDeps = {
  env: Record<string, string | undefined>
  readFile: ReadFileFn
}

function createFileCatalogSource(deps: FileCatalogSourceDeps): CatalogSource {
  return {
    async loadCatalog(): Promise<CatalogLoadOutcome> {
      const filePath = deps.env[CATALOG_FILE]?.trim()
      if (!filePath) return { status: 'unconfigured', missing: [CATALOG_FILE] }

      try {
        const fileContent = await deps.readFile(filePath)
        const catalog = CatalogDocumentZ.parse(JSON.parse(fileContent))
        return {
          status: 'ready',
          catalog,
          repos: [{ url: filePath, status: 'ok' }]
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err)
        return {
          status: 'error',
          message: reason,
          repos: [{ url: filePath, status: 'failed', reason }]
        }
      }
    }
  }
}

export { createFileCatalogSource, CATALOG_FILE }
