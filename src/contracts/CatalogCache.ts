import type { CatalogDocument } from '@core/catalog/CatalogSchema'

type CatalogCache = {
  readRepo(url: string): Promise<CatalogDocument | null>
  writeRepo(url: string, catalog: CatalogDocument): Promise<void>
}

export type { CatalogCache }
