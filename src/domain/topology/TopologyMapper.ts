import { Graph, GraphNode, GraphEdge } from '@domain/graph/GraphTypes'
import { Topology, TopologyEntry } from './TopologyTypes'

function graphToTopology(graph: Graph): Topology {
  const nodeMap = new Map<string, GraphNode>()
  for (const node of graph.nodes) nodeMap.set(node.id, node)

  const incomingDeps = new Map<string, string[]>()
  for (const node of graph.nodes) incomingDeps.set(node.id, [])

  for (const edge of graph.edges) {
    const sourceNode = nodeMap.get(edge.sourceNodeId)
    if (!sourceNode) continue
    const deps = incomingDeps.get(edge.targetNodeId)
    if (deps) deps.push(sourceNode.instanceId)
  }

  return graph.nodes.map(node => ({
    type: node.componentType,
    id: node.instanceId,
    dependencies: incomingDeps.get(node.id) ?? [],
    config: node.config
  }))
}

function topologyToGraph(topology: Topology): Graph {
  // Topology lacks position and version data — synthesize defaults for round-trip support
  const nodes = topology.map((entry, index) => ({
    id: entry.id,
    instanceId: entry.id,
    componentType: entry.type,
    module: '',
    version: '',
    position: { x: index * 200, y: 0 },
    config: entry.config,
    slots: []
  }))

  const edges: GraphEdge[] = []

  let edgeId = 0
  for (const entry of topology) {
    for (const depId of entry.dependencies) {
      edges.push({
        id: `edge-${edgeId++}`,
        sourceNodeId: depId,
        sourceSlot: '',
        targetNodeId: entry.id,
        targetSlot: ''
      })
    }
  }

  return {
    nodes,
    edges
  }
}

export {
  graphToTopology,
  topologyToGraph
}
