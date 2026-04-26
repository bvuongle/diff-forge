type TopologyEntry = {
  type: string
  id: string
  version: string
  source: string
  dependencies: string[]
  config: Record<string, unknown>
}

type Topology = TopologyEntry[]

export type { TopologyEntry, Topology }
