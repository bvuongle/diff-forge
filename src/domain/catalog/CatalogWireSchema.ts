import { z } from 'zod'

import { CatalogComponentZ, type CatalogComponent } from './CatalogSchema'

const CatalogIndexEntryZ = z.object({
  source: z.string().min(1),
  type: z.string().min(1),
  versions: z.array(z.string().min(1)).min(1)
})

const CatalogIndexZ = z.object({
  schema: z.literal('diff.catalog.index.v2'),
  repo: z.string().optional(),
  components: z.array(CatalogIndexEntryZ)
})

const ComponentFragmentZ = CatalogComponentZ.extend({
  schema: z.literal('diff.component.v2')
})

type CatalogIndex = z.infer<typeof CatalogIndexZ>
type CatalogIndexEntry = z.infer<typeof CatalogIndexEntryZ>
type ComponentFragment = z.infer<typeof ComponentFragmentZ>

function fragmentToComponent(fragment: ComponentFragment): CatalogComponent {
  return {
    type: fragment.type,
    source: fragment.source,
    version: fragment.version,
    implements: fragment.implements,
    requires: fragment.requires,
    configSchema: fragment.configSchema
  }
}

export { CatalogIndexZ, CatalogIndexEntryZ, ComponentFragmentZ, fragmentToComponent }
export type { CatalogIndex, CatalogIndexEntry, ComponentFragment }
