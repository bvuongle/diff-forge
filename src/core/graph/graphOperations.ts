import { Graph, GraphEdge, GraphNode, Position, Slot } from './GraphTypes'

function updateNodeById(graph: Graph, nodeId: string, patch: Partial<GraphNode>): Graph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n))
  }
}

function addNode(graph: Graph, node: GraphNode): Graph {
  if (graph.nodes.some((n) => n.id === node.id)) {
    throw new Error(`Node with id ${node.id} already exists`)
  }
  return {
    ...graph,
    nodes: [...graph.nodes, node]
  }
}

function removeNode(graph: Graph, nodeId: string): Graph {
  return {
    nodes: graph.nodes.filter((n) => n.id !== nodeId),
    edges: graph.edges.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId)
  }
}

function addEdge(graph: Graph, edge: GraphEdge): Graph {
  if (graph.edges.some((e) => e.id === edge.id)) {
    throw new Error(`Edge with id ${edge.id} already exists`)
  }
  return {
    ...graph,
    edges: [...graph.edges, edge]
  }
}

function removeEdge(graph: Graph, edgeId: string): Graph {
  return {
    ...graph,
    edges: graph.edges.filter((e) => e.id !== edgeId)
  }
}

function moveNode(graph: Graph, nodeId: string, position: Position): Graph {
  return updateNodeById(graph, nodeId, { position })
}

function updateNodeConfig(graph: Graph, nodeId: string, config: Record<string, unknown>): Graph {
  return updateNodeById(graph, nodeId, { config })
}

function renameNode(graph: Graph, oldId: string, newId: string): Graph {
  if (!newId.trim()) throw new Error('Node id cannot be empty')
  if (oldId === newId) return graph
  if (graph.nodes.some((n) => n.id === newId)) {
    throw new Error(`Node with id ${newId} already exists`)
  }
  const renamed = updateNodeById(graph, oldId, { id: newId, instanceId: newId })
  return {
    ...renamed,
    edges: renamed.edges.map((e) => ({
      ...e,
      sourceNodeId: e.sourceNodeId === oldId ? newId : e.sourceNodeId,
      targetNodeId: e.targetNodeId === oldId ? newId : e.targetNodeId
    }))
  }
}

function findSlotPair(
  nodes: GraphNode[],
  sourceNodeId: string,
  sourceSlotName: string,
  targetNodeId: string,
  targetSlotName: string
): { srcSlot: Slot; tgtSlot: Slot } | null {
  const src = nodes.find((n) => n.id === sourceNodeId)
  const tgt = nodes.find((n) => n.id === targetNodeId)
  if (!src || !tgt) return null
  const srcSlot = src.slots.find((s) => s.name === sourceSlotName && s.direction === 'out')
  const tgtSlot = tgt.slots.find((s) => s.name === targetSlotName && s.direction === 'in')
  if (!srcSlot || !tgtSlot) return null
  return { srcSlot, tgtSlot }
}

function isEdgeInvalid(edge: GraphEdge, nodes: GraphNode[]): boolean {
  const pair = findSlotPair(nodes, edge.sourceNodeId, edge.sourceSlot, edge.targetNodeId, edge.targetSlot)
  if (!pair) return true
  return pair.srcSlot.interface !== pair.tgtSlot.interface
}

type EdgeValidation = { valid: boolean; reason?: string }

function validateEdge(
  graph: Graph,
  sourceNodeId: string,
  sourceSlot: string,
  targetNodeId: string,
  targetSlot: string
): EdgeValidation {
  if (sourceNodeId === targetNodeId) return { valid: false, reason: 'Self-connection' }

  const srcExists = graph.nodes.some((n) => n.id === sourceNodeId)
  const tgtExists = graph.nodes.some((n) => n.id === targetNodeId)
  if (!srcExists || !tgtExists) return { valid: false, reason: 'Node not found' }

  const pair = findSlotPair(graph.nodes, sourceNodeId, sourceSlot, targetNodeId, targetSlot)
  if (!pair) return { valid: false, reason: 'Slot not found' }

  if (pair.srcSlot.interface !== pair.tgtSlot.interface) {
    return { valid: false, reason: 'Interface mismatch' }
  }

  const existing = graph.edges.filter((e) => e.targetNodeId === targetNodeId && e.targetSlot === targetSlot)
  if (existing.length >= pair.tgtSlot.maxConnections) {
    return { valid: false, reason: 'Max connections reached' }
  }

  return { valid: true }
}

export { addNode, removeNode, addEdge, removeEdge, moveNode, updateNodeConfig, renameNode, isEdgeInvalid, validateEdge }
