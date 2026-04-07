import type { CatalogSource } from '@ports/CatalogSource'
import type { TopologyExporter } from '@ports/TopologyExporter'
import type { GraphPersistence } from '@ports/GraphPersistence'

type AppServices = {
  catalogSource: CatalogSource
  topologyExporter: TopologyExporter
  graphPersistence: GraphPersistence
}

// TODO: wire ports to Electron IPC adapters
export type { AppServices }
