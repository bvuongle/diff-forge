import type { CatalogComponent } from './CatalogSchema'

type SearchMode = 'name' | 'interface'

type SearchResult =
  | { kind: 'flat'; matches: CatalogComponent[] }
  | { kind: 'grouped'; provides: CatalogComponent[]; accepts: CatalogComponent[] }

function searchCatalog(components: CatalogComponent[], query: string, mode: SearchMode): SearchResult {
  const trimmed = query.trim().toLowerCase()

  if (!trimmed) return { kind: 'flat', matches: components }

  if (mode === 'name') {
    return {
      kind: 'flat',
      matches: components.filter((c) => c.type.toLowerCase().includes(trimmed))
    }
  }

  const provides = components.filter((c) => c.implements.some((iface) => iface.toLowerCase().includes(trimmed)))
  const accepts = components.filter((c) => c.requires.some((req) => req.interface.toLowerCase().includes(trimmed)))
  return { kind: 'grouped', provides, accepts }
}

export { searchCatalog }
export type { SearchMode, SearchResult }
