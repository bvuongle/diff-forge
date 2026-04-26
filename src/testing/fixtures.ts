import type { CatalogComponent } from '@core/catalog/CatalogTypes'
import type { GraphEdge, GraphNode, Slot } from '@core/graph/GraphTypes'

function makeNode(id: string, overrides?: Partial<GraphNode>): GraphNode {
  return {
    id,
    instanceId: id,
    componentType: 'LinkEth',
    source: 'diff_broker',
    version: '1.0.0',
    position: { x: 0, y: 0 },
    config: {},
    slots: [],
    ...overrides
  }
}

function makeEdge(id: string, src: string, tgt: string, overrides?: Partial<GraphEdge>): GraphEdge {
  return {
    id,
    sourceNodeId: src,
    sourceSlot: 'ILink',
    targetNodeId: tgt,
    targetSlot: 'transport',
    ...overrides
  }
}

function makeCatalog(overrides?: Partial<CatalogComponent>): CatalogComponent {
  return {
    type: 'LinkEth',
    source: 'diff_broker',
    version: '1.0.0',
    implements: ['ILink'],
    requires: [{ slot: 'transport', interface: 'ITransport', min: 1, max: 1, order: 0 }],
    configSchema: {},
    ...overrides
  }
}

function makeSlot(overrides?: Partial<Slot>): Slot {
  return {
    name: 'transport',
    interface: 'ILink',
    direction: 'in',
    maxConnections: 1,
    ...overrides
  }
}

export { makeNode, makeEdge, makeCatalog, makeSlot }
