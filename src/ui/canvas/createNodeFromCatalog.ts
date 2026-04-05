import { CatalogComponent, VersionSchema } from '@domain/catalog/CatalogTypes'
import { GraphNode, Slot, Position } from '@domain/graph/GraphTypes'

function toCamelCase(typeName: string): string {
  return typeName.charAt(0).toLowerCase() + typeName.slice(1)
}

function getNextIndex(existingNodes: GraphNode[], camelType: string): number {
  let idx = 0
  const existing = new Set(existingNodes.map((n) => n.instanceId))
  while (existing.has(`${camelType}${idx}`)) {
    idx++
  }
  return idx
}

function buildSlots(versionSchema: VersionSchema): Slot[] {
  const slots: Slot[] = []

  for (const iface of versionSchema.implements) {
    slots.push({
      name: iface,
      interface: iface,
      direction: 'out',
      maxConnections: Infinity
    })
  }

  for (const req of versionSchema.requires) {
    slots.push({
      name: req.slot,
      interface: req.interface,
      direction: 'in',
      maxConnections: req.max
    })
  }

  return slots
}

function getDefaultVersion(component: CatalogComponent): string {
  const keys = Object.keys(component.versions)
  return keys[0] ?? '0.0.0'
}

function createNodeFromCatalog(
  component: CatalogComponent,
  position: Position,
  existingNodes: GraphNode[]
): GraphNode {
  const camelType = toCamelCase(component.type)
  const idx = getNextIndex(existingNodes, camelType)
  const instanceId = `${camelType}${idx}`
  const version = getDefaultVersion(component)
  const versionSchema = component.versions[version]

  return {
    id: instanceId,
    instanceId,
    componentType: component.type,
    module: component.module,
    version,
    position,
    config: {},
    slots: versionSchema ? buildSlots(versionSchema) : []
  }
}

export { createNodeFromCatalog, buildSlots }
