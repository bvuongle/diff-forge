import type { Graph } from '@core/graph/GraphTypes'

import type { CatalogComponent, ConfigValueSchema } from './CatalogSchema'
import { numericBound } from './configBounds'

type ConfigValidationResult = { ok: true; value: string | number } | { ok: false; error: string }
type ConfigFieldError = { field: string; error: string }
type NodeConfigError = ConfigFieldError & { nodeId: string; instanceId: string }

function checkConfigValue(schema: ConfigValueSchema, value: unknown): string | null {
  const bound = numericBound(schema.type)
  if (bound) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'Must be a number'
    if (bound.integer && !Number.isInteger(value)) return 'Must be an integer'
    const min = schema.min ?? bound.min
    const max = schema.max ?? bound.max
    if (value < min || value > max) return rangeError(min, max)
    return null
  }
  if (schema.type === 'bool') return typeof value === 'boolean' ? null : 'Must be true or false'
  return typeof value === 'string' ? null : 'Must be text'
}

function validateConfigValue(schema: ConfigValueSchema, raw: string): ConfigValidationResult {
  if (!numericBound(schema.type)) return { ok: true, value: raw }
  const trimmed = raw.trim()
  const num = Number(trimmed)
  if (trimmed === '' || !Number.isFinite(num)) return { ok: false, error: 'Must be a number' }
  const error = checkConfigValue(schema, num)
  return error ? { ok: false, error } : { ok: true, value: num }
}

function validateConfig(
  schema: Record<string, ConfigValueSchema>,
  config: Record<string, unknown>
): ConfigFieldError[] {
  const errors: ConfigFieldError[] = []
  for (const [field, value] of Object.entries(config)) {
    const fieldSchema = schema[field]
    if (!fieldSchema) {
      errors.push({ field, error: 'Unknown field' })
      continue
    }
    const error = checkConfigValue(fieldSchema, value)
    if (error) errors.push({ field, error })
  }
  return errors
}

function validateNodeConfigs(graph: Graph, catalog: CatalogComponent[]): NodeConfigError[] {
  const index = new Map<string, CatalogComponent>()
  for (const c of catalog) index.set(catalogKey(c.type, c.version, c.source), c)

  const errors: NodeConfigError[] = []
  for (const node of graph.nodes) {
    const component = index.get(catalogKey(node.componentType, node.version, node.source))
    if (!component) continue
    for (const { field, error } of validateConfig(component.config, node.configData)) {
      errors.push({ nodeId: node.id, instanceId: node.instanceId, field, error })
    }
  }
  return errors
}

function catalogKey(type: string, version: string, source: string): string {
  return `${type}@${version}@${source}`
}

function rangeError(min: number, max: number): string {
  if (min === -Infinity) return `Must be at most ${max}`
  if (max === Infinity) return `Must be at least ${min}`
  return `Must be between ${min} and ${max}`
}

export { validateConfigValue, validateConfig, validateNodeConfigs }
export type { ConfigValidationResult, ConfigFieldError, NodeConfigError }
