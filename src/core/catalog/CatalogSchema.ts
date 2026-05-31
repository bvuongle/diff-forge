import { z } from 'zod'

const CONFIG_VALUE_TYPES = [
  'bool',
  'int',
  'uint',
  'string',
  'int8',
  'uint8',
  'int16',
  'uint16',
  'int32',
  'uint32',
  'int64',
  'uint64',
  'float',
  'double'
] as const

type ConfigValueType = (typeof CONFIG_VALUE_TYPES)[number]

const ConfigValueSchemaZ = z.object({
  type: z.enum(CONFIG_VALUE_TYPES),
  min: z.number().optional(),
  max: z.number().optional(),
  default: z.unknown().optional()
})

const CatalogRequirementZ = z.object({
  name: z.string(),
  type: z.string(),
  isArray: z.boolean().optional().default(false)
})

const CatalogComponentZ = z.object({
  type: z.string(),
  source: z.string(),
  version: z.string(),
  implements: z.array(z.string()),
  requires: z.array(CatalogRequirementZ),
  config: z.record(z.string(), ConfigValueSchemaZ)
})

const CatalogDocumentZ = z.object({
  components: z.array(CatalogComponentZ)
})

type ConfigValueSchema = z.infer<typeof ConfigValueSchemaZ>
type CatalogComponent = z.infer<typeof CatalogComponentZ>
type CatalogDocument = z.infer<typeof CatalogDocumentZ>

export { CONFIG_VALUE_TYPES, CatalogComponentZ, CatalogDocumentZ }

export type { ConfigValueSchema, ConfigValueType, CatalogComponent, CatalogDocument }
