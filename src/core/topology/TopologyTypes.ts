type TopologyDependency = string | string[]

type TopologyEntry = {
  type: string
  id: string
  version: string
  source: string
  dependencies: TopologyDependency[]
  config: Record<string, unknown>
}

type Topology = TopologyEntry[]

export type { TopologyDependency, TopologyEntry, Topology }
