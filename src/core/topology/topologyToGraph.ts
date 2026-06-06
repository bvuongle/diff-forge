import { buildSlots } from '@core/catalog/buildSlots'
import { CatalogComponent } from '@core/catalog/CatalogSchema'
import { Graph, GraphEdge, GraphNode, Position } from '@core/graph/GraphTypes'
import { Topology, TopologyDependency, TopologyEntry } from '@core/topology/TopologyTypes'

const AUTO_LAYOUT_COLUMN_WIDTH = 320
const AUTO_LAYOUT_ROW_HEIGHT = 180

type TopologyParseResult = { status: 'parsed'; topology: Topology } | { status: 'error'; message: string }

function isDependency(value: unknown): value is TopologyDependency {
  if (typeof value === 'string') return true
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

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
      Array.isArray((entry as { dependencies?: unknown }).dependencies) &&
      (entry as { dependencies: unknown[] }).dependencies.every(isDependency)
  )
}

function parseTopology(json: string): TopologyParseResult {
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

function flattenDeps(dependencies: TopologyDependency[]): string[] {
  const flat: string[] = []
  for (const dep of dependencies) {
    if (typeof dep === 'string') {
      if (dep) flat.push(dep)
    } else {
      for (const id of dep) flat.push(id)
    }
  }
  return flat
}

function layoutByLevels(topology: Topology): Record<string, Position> {
  if (topology.length === 0) return {}

  const entryIds = new Set(topology.map((e) => e.id))
  const level = new Map<string, number>()
  const remainingDeps = new Map<string, number>()
  const dependents = new Map<string, string[]>()

  for (const entry of topology) {
    const validDeps = flattenDeps(entry.dependencies).filter((d) => entryIds.has(d))
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
    configData: entry.config,
    slots: catalog ? buildSlots(catalog) : []
  }
}

function pickSourceSlotName(sourceCatalog: CatalogComponent, expectedType: string): string | null {
  const direct = sourceCatalog.implements.find((iface) => iface === expectedType)
  if (direct) return direct
  return sourceCatalog.implements[0] ?? null
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
  const requires = targetCatalog.requires

  for (let slotIdx = 0; slotIdx < requires.length; slotIdx++) {
    const req = requires[slotIdx]
    const slotDeps = entry.dependencies[slotIdx]
    if (slotDeps === undefined) continue

    const ids = typeof slotDeps === 'string' ? (slotDeps ? [slotDeps] : []) : slotDeps

    for (const depId of ids) {
      const sourceNode = nodeMap.get(depId)
      if (!sourceNode) continue
      const sourceCatalog = catalogIndex.get(keyOf(sourceNode.componentType, sourceNode.version, sourceNode.source))
      if (!sourceCatalog) continue
      const sourceSlotName = pickSourceSlotName(sourceCatalog, req.type)
      if (!sourceSlotName) continue

      edges.push({
        id: `edge-${edgeId.next++}`,
        sourceNodeId: depId,
        sourceSlot: sourceSlotName,
        targetNodeId: entry.id,
        targetSlot: req.name
      })
    }
  }

  return edges
}

function topologyToGraph(topology: Topology, catalog: CatalogComponent[]): { graph: Graph; unresolved: string[] } {
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
export type { TopologyParseResult }
