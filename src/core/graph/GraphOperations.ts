import { Graph, GraphEdge, GraphNode, Position } from './GraphTypes'

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
  const filteredNodes = graph.nodes.filter((n) => n.id !== nodeId)
  const filteredEdges = graph.edges.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId)
  return {
    nodes: filteredNodes,
    edges: filteredEdges
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
  return {
    ...graph,
    nodes: graph.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n))
  }
}

function updateNodeConfig(graph: Graph, nodeId: string, config: Record<string, unknown>): Graph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) => (n.id === nodeId ? { ...n, config } : n))
  }
}

function renameNode(graph: Graph, oldId: string, newId: string): Graph {
  if (!newId.trim()) throw new Error('Node id cannot be empty')
  if (oldId === newId) return graph
  if (graph.nodes.some((n) => n.id === newId)) {
    throw new Error(`Node with id ${newId} already exists`)
  }
  return {
    nodes: graph.nodes.map((n) => (n.id === oldId ? { ...n, id: newId, instanceId: newId } : n)),
    edges: graph.edges.map((e) => ({
      ...e,
      sourceNodeId: e.sourceNodeId === oldId ? newId : e.sourceNodeId,
      targetNodeId: e.targetNodeId === oldId ? newId : e.targetNodeId
    }))
  }
}

function isEdgeInvalid(edge: GraphEdge, nodes: GraphNode[]): boolean {
  const src = nodes.find((n) => n.id === edge.sourceNodeId)
  const tgt = nodes.find((n) => n.id === edge.targetNodeId)
  if (!src || !tgt) return true
  const srcSlot = src.slots.find((s) => s.name === edge.sourceSlot && s.direction === 'out')
  const tgtSlot = tgt.slots.find((s) => s.name === edge.targetSlot && s.direction === 'in')
  if (!srcSlot || !tgtSlot) return true
  return srcSlot.interface !== tgtSlot.interface
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

  const src = graph.nodes.find((n) => n.id === sourceNodeId)
  const tgt = graph.nodes.find((n) => n.id === targetNodeId)
  if (!src || !tgt) return { valid: false, reason: 'Node not found' }

  const srcSlot = src.slots.find((s) => s.name === sourceSlot && s.direction === 'out')
  const tgtSlot = tgt.slots.find((s) => s.name === targetSlot && s.direction === 'in')
  if (!srcSlot || !tgtSlot) return { valid: false, reason: 'Slot not found' }

  if (srcSlot.interface !== tgtSlot.interface) {
    return { valid: false, reason: 'Interface mismatch' }
  }

  const existing = graph.edges.filter((e) => e.targetNodeId === targetNodeId && e.targetSlot === targetSlot)
  if (existing.length >= tgtSlot.maxConnections) {
    return { valid: false, reason: 'Max connections reached' }
  }

  return { valid: true }
}

export { addNode, removeNode, addEdge, removeEdge, moveNode, updateNodeConfig, renameNode, isEdgeInvalid, validateEdge }
