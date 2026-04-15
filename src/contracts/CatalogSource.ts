import { CatalogDocument } from '@domain/catalog/CatalogTypes'

type CatalogSource = {
  loadCatalog(): Promise<CatalogDocument>
}

export type { CatalogSource }
