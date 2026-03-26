// Core catalog types representing C++ component definitions

type ConfigValueSchema = {
  type: 'bool' | 'int' | 'uint' | 'string'
  min?: number
  max?: number
  default?: unknown
}

type CatalogRequirement = {
  slot: string
  interface: string
  min: number
  max: number
  order: number
}

type CatalogComponent = {
  type: string
  module: string
  versions: string[]
  implements: string[]
  requires: CatalogRequirement[]
  configSchema: Record<string, ConfigValueSchema>
}

type CatalogDocument = {
  schema: 'diff.catalog.v0'
  components: CatalogComponent[]
}

export type {
  ConfigValueSchema,
  CatalogRequirement,
  CatalogComponent,
  CatalogDocument
}
