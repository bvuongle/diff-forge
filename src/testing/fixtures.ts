import type { CatalogComponent } from '@domain/catalog/CatalogTypes'
import type { GraphEdge, GraphNode } from '@domain/graph/GraphTypes'

function makeNode(id: string, overrides?: Partial<GraphNode>): GraphNode {
  return {
    id,
    instanceId: id,
    componentType: 'LinkEth',
    module: 'link',
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
    module: 'link',
    versions: {
      '1.0.0': {
        implements: ['ILink'],
        requires: [{ slot: 'transport', interface: 'ITransport', min: 1, max: 1, order: 0 }],
        configSchema: {}
      }
    },
    ...overrides
  }
}

export { makeNode, makeEdge, makeCatalog }
