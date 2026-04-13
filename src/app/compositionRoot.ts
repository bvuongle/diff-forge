import type { CatalogSource } from '@ports/CatalogSource'
import type { GraphPersistence } from '@ports/GraphPersistence'
import type { TopologyExporter } from '@ports/TopologyExporter'

type AppServices = {
  catalogSource: CatalogSource
  topologyExporter: TopologyExporter
  graphPersistence: GraphPersistence
}

// TODO: wire ports to Electron IPC adapters
export type { AppServices }
