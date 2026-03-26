import { Graph, GraphNode, GraphEdge, Position } from './GraphTypes'

// Pure functional operations on graph structure

function addNode(
  graph: Graph,
  node: GraphNode
): Graph {
  if (graph.nodes.some(n => n.id === node.id)) {
    throw new Error(`Node with id ${node.id} already exists`)
  }
  return {
    ...graph,
    nodes: [...graph.nodes, node]
  }
}

function removeNode(
  graph: Graph,
  nodeId: string
): Graph {
  const filteredNodes = graph.nodes.filter(n => n.id !== nodeId)
  const filteredEdges = graph.edges.filter(
    e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId
  )
  return {
    nodes: filteredNodes,
    edges: filteredEdges
  }
}

function addEdge(
  graph: Graph,
  edge: GraphEdge
): Graph {
  if (graph.edges.some(e => e.id === edge.id)) {
    throw new Error(`Edge with id ${edge.id} already exists`)
  }
  return {
    ...graph,
    edges: [...graph.edges, edge]
  }
}

function removeEdge(
  graph: Graph,
  edgeId: string
): Graph {
  return {
    ...graph,
    edges: graph.edges.filter(e => e.id !== edgeId)
  }
}

function moveNode(
  graph: Graph,
  nodeId: string,
  position: Position
): Graph {
  return {
    ...graph,
    nodes: graph.nodes.map(n =>
      n.id === nodeId ? { ...n, position } : n
    )
  }
}

function updateNodeConfig(
  graph: Graph,
  nodeId: string,
  config: Record<string, unknown>
): Graph {
  return {
    ...graph,
    nodes: graph.nodes.map(n =>
      n.id === nodeId ? { ...n, config } : n
    )
  }
}

export {
  addNode,
  removeNode,
  addEdge,
  removeEdge,
  moveNode,
  updateNodeConfig
}
