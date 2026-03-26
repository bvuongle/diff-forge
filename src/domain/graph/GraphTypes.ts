// Internal representation of a dependency graph being composed

type Position = {
  x: number
  y: number
}

type Slot = {
  name: string
  interface: string
  direction: 'in' | 'out'
  maxConnections: number
}

type GraphNode = {
  id: string
  instanceId: string
  componentType: string
  module: string
  version: string
  position: Position
  config: Record<string, unknown>
  slots: Slot[]
}

type GraphEdge = {
  id: string
  sourceNodeId: string
  sourceSlot: string
  targetNodeId: string
  targetSlot: string
}

type Graph = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type {
  Position,
  Slot,
  GraphNode,
  GraphEdge,
  Graph
}
