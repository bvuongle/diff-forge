import type { CatalogComponent } from '@core/catalog/CatalogSchema'
import type { GraphEdge, GraphNode, Slot } from '@core/graph/GraphTypes'

function makeNode(id: string, overrides?: Partial<GraphNode>): GraphNode {
  return {
    id,
    instanceId: id,
    componentType: 'LinkEth',
    source: 'diff_broker',
    version: '1.0.0',
    position: { x: 0, y: 0 },
    configData: {},
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
    requires: [{ slot: 'transport', type: 'ITransport', isArray: false }],
    config: {},
    ...overrides
  }
}

function makeSlot(overrides?: Partial<Slot>): Slot {
  return {
    name: 'transport',
    type: 'ILink',
    direction: 'in',
    isArray: false,
    ...overrides
  }
}

export { makeNode, makeEdge, makeCatalog, makeSlot }
