import { buildSlots } from '@core/catalog/buildSlots'
import { CatalogComponent } from '@core/catalog/CatalogSchema'
import { GraphNode, Position } from '@core/graph/GraphTypes'

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

function createNodeFromCatalog(component: CatalogComponent, position: Position, existingNodes: GraphNode[]): GraphNode {
  const camelType = toCamelCase(component.type)
  const idx = getNextIndex(existingNodes, camelType)
  const instanceId = `${camelType}${idx}`

  return {
    id: instanceId,
    instanceId,
    componentType: component.type,
    source: component.source,
    version: component.version,
    position,
    config: {},
    slots: buildSlots(component)
  }
}

export { createNodeFromCatalog }
