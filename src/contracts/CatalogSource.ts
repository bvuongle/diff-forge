import { CatalogDocument } from '@core/catalog/CatalogSchema'

type CatalogSource = {
  loadCatalog(): Promise<CatalogDocument>
}

export type { CatalogSource }
