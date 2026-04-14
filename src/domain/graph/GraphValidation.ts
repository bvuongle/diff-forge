import { isEdgeInvalid } from './GraphOperations'
import { Graph } from './GraphTypes'

export type GraphValidationResult = {
  valid: boolean
  cycles: string[][]
  orphans: string[]
  invalidEdges: string[]
}

/**
 * Detects all simple cycles in the graph using DFS.
 * Returns an array of cycles, where each cycle is an array of node IDs.
 */
export function detectCycles(graph: Graph): string[][] {
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
        // Cycle detected
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

/**
 * Returns node IDs that have no edges (neither source nor target).
 */
export function detectOrphans(graph: Graph): string[] {
  const connectedNodes = new Set<string>()
  for (const edge of graph.edges) {
    connectedNodes.add(edge.sourceNodeId)
    connectedNodes.add(edge.targetNodeId)
  }

  return graph.nodes.filter((node) => !connectedNodes.has(node.id)).map((node) => node.id)
}

/**
 * Combines cycle detection, orphan detection, and invalid edge checks.
 * A graph is 'valid' if it has no cycles and no invalid edges.
 */
export function validateGraph(graph: Graph): GraphValidationResult {
  const cycles = detectCycles(graph)
  const orphans = detectOrphans(graph)
  const invalidEdges = graph.edges.filter((edge) => isEdgeInvalid(edge, graph.nodes)).map((edge) => edge.id)

  return {
    valid: cycles.length === 0 && invalidEdges.length === 0,
    cycles,
    orphans,
    invalidEdges
  }
}
