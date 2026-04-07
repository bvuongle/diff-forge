import { Graph } from '@domain/graph/GraphTypes'
import { Topology, TopologyEntry } from './TopologyTypes'

function graphToTopology(graph: Graph): Topology {
  const outgoingEdges = new Map<string, string[]>()
  graph.nodes.forEach(node => {
    outgoingEdges.set(node.id, [])
  })

  graph.edges.forEach(edge => {
    const deps = outgoingEdges.get(edge.sourceNodeId) || []
    deps.push(edge.targetNodeId)
    outgoingEdges.set(edge.sourceNodeId, deps)
  })

  const topology: Topology = graph.nodes.map(node => ({
    type: node.componentType,
    id: node.instanceId,
    dependencies: outgoingEdges.get(node.id) || [],
    config: node.config
  }))

  return topology
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

  const edges: typeof nodes extends (infer T)[] ?
    Array<{ id: string; sourceNodeId: string; sourceSlot: string; targetNodeId: string; targetSlot: string }> :
    never = []

  let edgeId = 0
  topology.forEach((entry, idx) => {
    entry.dependencies.forEach(depId => {
      edges.push({
        id: `edge-${edgeId++}`,
        sourceNodeId: entry.id,
        sourceSlot: '',
        targetNodeId: depId,
        targetSlot: ''
      })
    })
  })

  return {
    nodes,
    edges
  }
}

export {
  graphToTopology,
  topologyToGraph
}
