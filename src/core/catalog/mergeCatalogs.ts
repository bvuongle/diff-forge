import type { CatalogComponent, CatalogDocument } from './CatalogSchema'

function mergeCatalogs(docs: CatalogDocument[]): CatalogDocument {
  const byKey = new Map<string, CatalogComponent>()
  for (const doc of docs) {
    for (const component of doc.components) {
      const key = `${component.source}::${component.type}::${component.version}`
      if (!byKey.has(key)) byKey.set(key, component)
    }
  }
  return { components: [...byKey.values()] }
}

export { mergeCatalogs }
