type Position = {
  x: number
  y: number
}

type Slot = {
  name: string
  type: string
  direction: 'in' | 'out'
  isArray: boolean
}

type GraphNode = {
  id: string
  instanceId: string
  componentType: string
  source: string
  version: string
  position: Position
  configData: Record<string, unknown>
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

export type { Position, Slot, GraphNode, GraphEdge, Graph }
