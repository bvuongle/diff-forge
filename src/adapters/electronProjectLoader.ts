import { Topology } from '@domain/topology/TopologyTypes'

type ProjectLoadResult =
  | { status: 'loaded'; topology: Topology; topologyPath: string }
  | { status: 'notFound' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string }

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

async function loadProjectFromCwd(): Promise<ProjectLoadResult> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    return { status: 'unavailable' }
  }
  const outcome = await window.electronAPI.project.load()
  if (outcome.status === 'notFound') return { status: 'notFound' }
  if (outcome.status === 'error') return { status: 'error', message: outcome.message }

  try {
    const topology: unknown = JSON.parse(outcome.topology)
    if (!isTopology(topology)) {
      return { status: 'error', message: 'Topology file has an unexpected shape' }
    }
    return {
      status: 'loaded',
      topology,
      topologyPath: outcome.topologyPath
    }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
}

export { loadProjectFromCwd }
export type { ProjectLoadResult }
