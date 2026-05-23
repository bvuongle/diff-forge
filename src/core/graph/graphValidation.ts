import { isEdgeInvalid } from './graphOperations'
import { Graph } from './GraphTypes'

type UnfilledSlot = {
  nodeId: string
  instanceId: string
  slotName: string
}

type GraphValidationResult = {
  valid: boolean
  cycles: string[][]
  unfilled: UnfilledSlot[]
  invalidEdges: string[]
}

function detectCycles(graph: Graph): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const recStack = new Set<string>()
  const parent = new Map<string, string>()

  const adj = new Map<string, string[]>()
  for (const edge of graph.edges) {
    const neighbors = adj.get(edge.sourceNodeId) ?? []
    neighbors.push(edge.targetNodeId)
    adj.set(edge.sourceNodeId, neighbors)
  }

  function dfs(u: string) {
    visited.add(u)
    recStack.add(u)

    const neighbors = adj.get(u) ?? []
    for (const v of neighbors) {
      if (!visited.has(v)) {
        parent.set(v, u)
        dfs(v)
      } else if (recStack.has(v)) {
        const cycle = [v]
        let curr = u
        while (curr !== v && curr !== undefined) {
          cycle.push(curr)
          curr = parent.get(curr)!
        }
        cycles.push(cycle.reverse())
      }
    }

    recStack.delete(u)
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id)
    }
  }

  return cycles
}

function detectUnfilledRequiredSlots(graph: Graph): UnfilledSlot[] {
  const counts = new Map<string, number>()
  for (const edge of graph.edges) {
    const key = `${edge.targetNodeId}::${edge.targetSlot}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const unfilled: UnfilledSlot[] = []
  for (const node of graph.nodes) {
    for (const slot of node.slots) {
      if (slot.direction !== 'in' || slot.isArray) continue
      const key = `${node.id}::${slot.name}`
      if ((counts.get(key) ?? 0) === 0) {
        unfilled.push({ nodeId: node.id, instanceId: node.instanceId, slotName: slot.name })
      }
    }
  }
  return unfilled
}

function validateGraph(graph: Graph): GraphValidationResult {
  const cycles = detectCycles(graph)
  const unfilled = detectUnfilledRequiredSlots(graph)
  const invalidEdges = graph.edges.filter((edge) => isEdgeInvalid(edge, graph.nodes)).map((edge) => edge.id)

  return {
    valid: cycles.length === 0 && unfilled.length === 0 && invalidEdges.length === 0,
    cycles,
    unfilled,
    invalidEdges
  }
}

function computeInvalidNodeIds(graph: Graph): Set<string> {
  const result = validateGraph(graph)
  const ids = new Set<string>()
  for (const cycle of result.cycles) {
    for (const id of cycle) ids.add(id)
  }
  for (const u of result.unfilled) ids.add(u.nodeId)
  for (const edgeId of result.invalidEdges) {
    const edge = graph.edges.find((e) => e.id === edgeId)
    if (edge) {
      ids.add(edge.sourceNodeId)
      ids.add(edge.targetNodeId)
    }
  }
  return ids
}

export { computeInvalidNodeIds, detectCycles, detectUnfilledRequiredSlots, validateGraph }
export type { GraphValidationResult, UnfilledSlot }
