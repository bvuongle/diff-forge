import { buildSlots } from '@core/catalog/buildSlots'
import { CatalogComponent } from '@core/catalog/CatalogSchema'
import { Graph, GraphEdge, GraphNode, Position } from '@core/graph/GraphTypes'
import { Topology, TopologyEntry } from '@core/topology/TopologyTypes'

const AUTO_LAYOUT_COLUMN_WIDTH = 320
const AUTO_LAYOUT_ROW_HEIGHT = 180

type TopologyParseOutcome = { status: 'parsed'; topology: Topology } | { status: 'error'; message: string }

function isTopology(data: unknown): data is Topology {
  if (!Array.isArray(data)) return false
  return data.every(
    (entry) =>
      entry !== null &&
      typeof entry === 'object' &&
      typeof (entry as { type?: unknown }).type === 'string' &&
      typeof (entry as { id?: unknown }).id === 'string' &&
      typeof (entry as { version?: unknown }).version === 'string' &&
      typeof (entry as { source?: unknown }).source === 'string' &&
      Array.isArray((entry as { dependencies?: unknown }).dependencies)
  )
}

function parseTopology(json: string): TopologyParseOutcome {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
  if (!isTopology(data)) {
    return { status: 'error', message: 'Topology file has an unexpected shape' }
  }
  return { status: 'parsed', topology: data }
}

function layoutByLevels(topology: Topology): Record<string, Position> {
  if (topology.length === 0) return {}

  const entryIds = new Set(topology.map((e) => e.id))
  const level = new Map<string, number>()
  const remainingDeps = new Map<string, number>()
  const dependents = new Map<string, string[]>()

  for (const entry of topology) {
    const validDeps = entry.dependencies.filter((d) => entryIds.has(d))
    remainingDeps.set(entry.id, validDeps.length)
    for (const dep of validDeps) {
      if (!dependents.has(dep)) dependents.set(dep, [])
      dependents.get(dep)!.push(entry.id)
    }
  }

  let frontier = topology.filter((e) => remainingDeps.get(e.id) === 0).map((e) => e.id)
  let currentLevel = 0
  while (frontier.length > 0) {
    for (const id of frontier) level.set(id, currentLevel)
    const next: string[] = []
    for (const id of frontier) {
      for (const child of dependents.get(id) ?? []) {
        const deg = (remainingDeps.get(child) ?? 0) - 1
        remainingDeps.set(child, deg)
        if (deg === 0) next.push(child)
      }
    }
    frontier = next
    currentLevel++
  }

  for (const entry of topology) {
    if (!level.has(entry.id)) level.set(entry.id, currentLevel)
  }

  const withinLevel = new Map<number, number>()
  const positions: Record<string, Position> = {}
  for (const entry of topology) {
    const lv = level.get(entry.id) ?? 0
    const row = withinLevel.get(lv) ?? 0
    withinLevel.set(lv, row + 1)
    positions[entry.id] = {
      x: lv * AUTO_LAYOUT_COLUMN_WIDTH,
      y: row * AUTO_LAYOUT_ROW_HEIGHT
    }
  }
  return positions
}

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

type Requirement = CatalogComponent['requires'][number]

function pickRequirement(
  requires: Requirement[],
  used: number[],
  startIdx: number,
  sourceImplements: string[]
): number {
  let i = startIdx
  while (i < requires.length) {
    if (used[i] >= requires[i].max) {
      i++
      continue
    }
    if (sourceImplements.includes(requires[i].interface)) return i
    if (used[i] < requires[i].min) return i
    i++
  }
  return i
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

    reqIdx = pickRequirement(requires, used, reqIdx, sourceCatalog.implements)
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

export { AUTO_LAYOUT_COLUMN_WIDTH, AUTO_LAYOUT_ROW_HEIGHT, isTopology, layoutByLevels, parseTopology, topologyToGraph }
export type { ReconstitutionResult, TopologyParseOutcome }
