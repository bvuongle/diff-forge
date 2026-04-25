import type { CatalogComponent } from './CatalogSchema'

type SearchMode = 'name' | 'interface'

type SearchResult =
  | { kind: 'flat'; matches: CatalogComponent[] }
  | { kind: 'grouped'; provides: CatalogComponent[]; accepts: CatalogComponent[] }

const ALL_SOURCES = '__all__'

function searchCatalog(
  components: CatalogComponent[],
  query: string,
  mode: SearchMode,
  sourceFilter: string = ALL_SOURCES
): SearchResult {
  const sourceScoped = sourceFilter === ALL_SOURCES ? components : components.filter((c) => c.source === sourceFilter)
  const trimmed = query.trim().toLowerCase()

  if (!trimmed) return { kind: 'flat', matches: sourceScoped }

  if (mode === 'name') {
    return {
      kind: 'flat',
      matches: sourceScoped.filter((c) => c.type.toLowerCase().includes(trimmed))
    }
  }

  const provides = sourceScoped.filter((c) => c.implements.some((iface) => iface.toLowerCase().includes(trimmed)))
  const accepts = sourceScoped.filter((c) => c.requires.some((req) => req.interface.toLowerCase().includes(trimmed)))
  return { kind: 'grouped', provides, accepts }
}

function listSources(components: CatalogComponent[]): string[] {
  const set = new Set<string>()
  for (const c of components) set.add(c.source)
  return [...set].sort()
}

export { searchCatalog, listSources, ALL_SOURCES }
export type { SearchMode, SearchResult }
