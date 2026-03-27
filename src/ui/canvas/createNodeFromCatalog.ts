import { CatalogComponent } from '@domain/catalog/CatalogTypes'
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

function buildSlots(component: CatalogComponent): Slot[] {
  const slots: Slot[] = []

  for (const iface of component.implements) {
    slots.push({
      name: iface,
      interface: iface,
      direction: 'out',
      maxConnections: Infinity
    })
  }

  for (const req of component.requires) {
    slots.push({
      name: req.slot,
      interface: req.interface,
      direction: 'in',
      maxConnections: req.max
    })
  }

  return slots
}

function createNodeFromCatalog(
  component: CatalogComponent,
  position: Position,
  existingNodes: GraphNode[]
): GraphNode {
  const camelType = toCamelCase(component.type)
  const idx = getNextIndex(existingNodes, camelType)
  const instanceId = `${camelType}${idx}`

  return {
    id: instanceId,
    instanceId,
    componentType: component.type,
    module: component.module,
    version: component.versions[0] ?? '0.0.0',
    position,
    config: {},
    slots: buildSlots(component)
  }
}

export { createNodeFromCatalog }
