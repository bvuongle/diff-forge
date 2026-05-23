import type { CatalogComponent, CatalogDocument } from '@core/catalog/CatalogSchema'

type CatalogCache = {
  writeCache(component: CatalogComponent): Promise<void>
  readCache(): Promise<CatalogDocument | null>
  clearRepo(sourceUrl: string): Promise<void>
  clear(): Promise<void>
}

export type { CatalogCache }
