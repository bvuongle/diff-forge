import { CatalogDocument } from '../domain/catalog/CatalogTypes'

// Port: defines how catalog data enters the system

type CatalogSource = {
  loadCatalog(): Promise<CatalogDocument>
}

export type { CatalogSource }
