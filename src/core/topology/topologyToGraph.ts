import { buildSlots } from '@core/catalog/buildSlots'
import { CatalogComponent } from '@core/catalog/CatalogTypes'
import { Graph, GraphEdge, GraphNode, Position } from '@core/graph/GraphTypes'
import { layoutByLevels } from '@core/layout/layoutByLevels'
import { Topology, TopologyEntry } from '@core/topology/TopologyTypes'

type CatalogKey = string

function keyOf(type: string, version: string, source: string): CatalogKey {
  return `${source}::${type}@${version}`
}

function buildCatalogIndex(catalog: CatalogComponent[]): Map<CatalogKey, CatalogComponent> {
  const index = new Map<CatalogKey, CatalogComponent>()
  for (const c of catalog) index.set(keyOf(c.type, c.version, c.source), c)
  return index
}

function nodeFromEntry(entry: TopologyEntry, catalog: CatalogComponent | undefined, position: Position): GraphNode {
  return {
    id: entry.id,
    instanceId: entry.id,
    componentType: entry.type,
    source: entry.source,
    version: entry.version,
    position,
    config: entry.config,
    slots: catalog ? buildSlots(catalog) : []
  }
}

function assignEdgesForEntry(
  entry: TopologyEntry,
  targetCatalog: CatalogComponent | undefined,
  catalogIndex: Map<CatalogKey, CatalogComponent>,
  nodeMap: Map<string, GraphNode>,
  edgeId: { next: number }
): GraphEdge[] {
  if (!targetCatalog) return []

  const edges: GraphEdge[] = []
  const requires = [...targetCatalog.requires].sort((a, b) => a.order - b.order)
  const used: number[] = requires.map(() => 0)

  let reqIdx = 0
  for (const depId of entry.dependencies) {
    const sourceNode = nodeMap.get(depId)
    const sourceCatalog = sourceNode
      ? catalogIndex.get(keyOf(sourceNode.componentType, sourceNode.version, sourceNode.source))
      : undefined
    if (!sourceCatalog) continue

    while (reqIdx < requires.length) {
      const req = requires[reqIdx]
      if (used[reqIdx] >= req.max) {
        reqIdx++
        continue
      }
      const matches = sourceCatalog.implements.includes(req.interface)
      if (matches) break
      if (used[reqIdx] < req.min) break
      reqIdx++
    }

    const req = requires[reqIdx]
    if (!req) continue
    const sourceSlot = sourceCatalog.implements.find((i) => i === req.interface) ?? sourceCatalog.implements[0]
    if (!sourceSlot) continue

    edges.push({
      id: `edge-${edgeId.next++}`,
      sourceNodeId: depId,
      sourceSlot,
      targetNodeId: entry.id,
      targetSlot: req.slot
    })

    used[reqIdx]++
  }

  return edges
}

type ReconstitutionResult = {
  graph: Graph
  unresolved: string[]
}

function topologyToGraph(topology: Topology, catalog: CatalogComponent[]): ReconstitutionResult {
  const catalogIndex = buildCatalogIndex(catalog)
  const unresolved: string[] = []
  const nodes: GraphNode[] = []
  const positions = layoutByLevels(topology)

  for (const entry of topology) {
    const component = catalogIndex.get(keyOf(entry.type, entry.version, entry.source))
    if (!component) unresolved.push(entry.id)
    nodes.push(nodeFromEntry(entry, component, positions[entry.id] ?? { x: 0, y: 0 }))
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const edges: GraphEdge[] = []
  const edgeId = { next: 0 }

  for (const entry of topology) {
    const targetCatalog = catalogIndex.get(keyOf(entry.type, entry.version, entry.source))
    edges.push(...assignEdgesForEntry(entry, targetCatalog, catalogIndex, nodeMap, edgeId))
  }

  return { graph: { nodes, edges }, unresolved }
}

export { topologyToGraph }
export type { ReconstitutionResult }
