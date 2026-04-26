import { CatalogDocument } from '@core/catalog/CatalogTypes'

type CatalogSource = {
  loadCatalog(): Promise<CatalogDocument>
}

export type { CatalogSource }
