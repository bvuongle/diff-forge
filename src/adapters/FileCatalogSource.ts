import { CatalogSource } from '@ports/CatalogSource'
import { CatalogDocument, CatalogDocumentZ } from '@domain/catalog/CatalogSchema'

type FileCatalogSourceDeps = {
  filePath: string
  loadFile(path: string): Promise<string>
}

function createFileCatalogSource(deps: FileCatalogSourceDeps): CatalogSource {
  return {
    async loadCatalog(): Promise<CatalogDocument> {
      const fileContent = await deps.loadFile(deps.filePath)
      const parsed = JSON.parse(fileContent)
      const validated = CatalogDocumentZ.parse(parsed)
      return validated
    }
  }
}

export { createFileCatalogSource }
export type { FileCatalogSourceDeps }
