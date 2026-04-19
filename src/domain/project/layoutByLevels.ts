import { Position } from '@domain/graph/GraphTypes'
import { Topology } from '@domain/topology/TopologyTypes'
import { AUTO_LAYOUT_COLUMN_WIDTH, AUTO_LAYOUT_ROW_HEIGHT } from '@canvas/canvasConstants'

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

export { layoutByLevels }
