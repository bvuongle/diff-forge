import { z } from 'zod'

const ConfigValueSchemaZ = z.object({
  type: z.enum(['bool', 'int', 'uint', 'string']),
  min: z.number().optional(),
  max: z.number().optional(),
  default: z.unknown().optional()
})

const CatalogRequirementZ = z.object({
  slot: z.string(),
  interface: z.string(),
  min: z.number().int().nonnegative(),
  max: z.number().int().positive(),
  order: z.number().int().nonnegative()
})

const CatalogComponentZ = z.object({
  type: z.string(),
  module: z.string(),
  versions: z.array(z.string()),
  implements: z.array(z.string()),
  requires: z.array(CatalogRequirementZ),
  configSchema: z.record(z.string(), ConfigValueSchemaZ)
})

const CatalogDocumentZ = z.object({
  schema: z.literal('diff.catalog.v0'),
  components: z.array(CatalogComponentZ)
})

type ConfigValueSchema = z.infer<typeof ConfigValueSchemaZ>
type CatalogRequirement = z.infer<typeof CatalogRequirementZ>
type CatalogComponent = z.infer<typeof CatalogComponentZ>
type CatalogDocument = z.infer<typeof CatalogDocumentZ>

export { CatalogDocumentZ }

export type {
  ConfigValueSchema,
  CatalogRequirement,
  CatalogComponent,
  CatalogDocument
}
