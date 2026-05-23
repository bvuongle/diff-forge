import { Graph, GraphEdge, GraphNode } from '@core/graph/GraphTypes'
import { Topology, TopologyDependency, TopologyEntry } from '@core/topology/TopologyTypes'

function depsFor(
  node: GraphNode,
  incomingEdges: Map<string, GraphEdge[]>,
  nodeMap: Map<string, GraphNode>
): TopologyDependency[] {
  const inSlots = node.slots.filter((s) => s.direction === 'in')
  const edges = incomingEdges.get(node.id) ?? []
  const edgesBySlot = new Map<string, GraphEdge[]>()
  for (const edge of edges) {
    const list = edgesBySlot.get(edge.targetSlot) ?? []
    list.push(edge)
    edgesBySlot.set(edge.targetSlot, list)
  }

  return inSlots.map((slot) => {
    const slotEdges = edgesBySlot.get(slot.name) ?? []
    const ids = slotEdges
      .map((e) => nodeMap.get(e.sourceNodeId)?.instanceId)
      .filter((id): id is string => typeof id === 'string')
    if (slot.isArray) return ids
    return ids[0] ?? ''
  })
}

function toEntry(node: GraphNode, dependencies: TopologyDependency[]): TopologyEntry {
  return {
    type: node.componentType,
    id: node.instanceId,
    version: node.version,
    source: node.source,
    dependencies,
    config: node.configData
  }
}

function graphToTopology(graph: Graph): Topology {
  const nodeMap = new Map<string, GraphNode>()
  const nodeOrder = new Map<GraphNode, number>()
  graph.nodes.forEach((node, i) => {
    nodeMap.set(node.id, node)
    nodeOrder.set(node, i)
  })

  const incomingEdges = new Map<string, GraphEdge[]>()
  const dependents = new Map<string, string[]>()
  const indegree = new Map<string, number>()

  for (const node of graph.nodes) {
    incomingEdges.set(node.id, [])
    dependents.set(node.id, [])
    indegree.set(node.id, 0)
  }

  for (const edge of graph.edges) {
    const sourceNode = nodeMap.get(edge.sourceNodeId)
    const targetNode = nodeMap.get(edge.targetNodeId)
    if (!sourceNode || !targetNode) continue
    incomingEdges.get(targetNode.id)!.push(edge)
    dependents.get(sourceNode.id)!.push(targetNode.id)
    indegree.set(targetNode.id, (indegree.get(targetNode.id) ?? 0) + 1)
  }

  let frontier = graph.nodes.filter((n) => (indegree.get(n.id) ?? 0) === 0)
  const emitted = new Set<string>()
  const result: Topology = []

  while (frontier.length > 0) {
    for (const node of frontier) {
      result.push(toEntry(node, depsFor(node, incomingEdges, nodeMap)))
      emitted.add(node.id)
    }
    const nextFrontier: GraphNode[] = []
    for (const node of frontier) {
      for (const targetId of dependents.get(node.id) ?? []) {
        const newDeg = (indegree.get(targetId) ?? 0) - 1
        indegree.set(targetId, newDeg)
        if (newDeg === 0) {
          const target = nodeMap.get(targetId)
          if (target) nextFrontier.push(target)
        }
      }
    }
    nextFrontier.sort((a, b) => (nodeOrder.get(a) ?? 0) - (nodeOrder.get(b) ?? 0))
    frontier = nextFrontier
  }

  for (const node of graph.nodes) {
    if (!emitted.has(node.id)) {
      result.push(toEntry(node, depsFor(node, incomingEdges, nodeMap)))
    }
  }

  return result
}

export { graphToTopology }
