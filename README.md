# diff-forge

A desktop tool for visually composing C++ dependency graphs. Built with Electron, React, and TypeScript.

Users load component metadata from a catalog, drag them onto a canvas, wire dependencies between them, and export a `topology.json` file that the C++ diff framework consumes to configure builds.

## Prerequisites

- Node.js 22 LTS
- pnpm 10 (via corepack: `corepack enable`)

## Getting Started

```bash
corepack enable
pnpm install
pnpm dev
```

This starts Electron with Vite dev server on localhost:5173 and hot-reload enabled.

## Development

### Scripts

| Script | What it does |
|--------|-------------|
| `pnpm dev` | Dev server with Electron + HMR |
| `pnpm build` | Production build (dist/ + dist-electron/) |
| `pnpm preview` | Preview production build locally |
| `pnpm test` | Run Vitest unit tests |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:coverage` | Unit tests with coverage |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm typecheck` | TypeScript compiler check |

## Testing

Unit tests use Vitest with React Testing Library. E2E tests use Playwright.

```bash
pnpm test          # unit tests
pnpm test:e2e      # e2e tests
pnpm typecheck     # type checking
```

## Project Structure

```
diff-forge/
  electron/                   Electron main + preload
  src/
    domain/                   Pure business logic, no framework deps
      catalog/                Catalog schema + types (Zod validated)
      graph/                  Graph types + pure operations
      topology/               Topology types + mapper to/from graph
    ports/                    Interfaces only (CatalogSource, TopologyExporter, GraphPersistence)
    adapters/                 Port implementations
      catalog/                File-based catalog loading
      export/                 JSON topology export
      persistence/            Graph state persistence
    state/                    Zustand stores (catalogStore, graphStore, uiStore)
    ui/
      layout/                 Top-level panels (MainLayout, CanvasPanel, LeftCatalogPanel, Topbar)
      canvas/                 Canvas components, hooks, utils, and co-located tests
      components/             Shared UI components (SectionHeader, SearchInput)
    styles/                   Theme + global styles
    assets/mock/              Dev catalog data
    app/                      App component + composition root
    main.tsx                  Entry point
  tests/                      Domain and state unit tests, shared fixtures
  e2e/                        Playwright specs
```

## Architecture

The app follows hexagonal architecture (ports and adapters). Three layers keep concerns separated:

**Domain** -- pure TypeScript with no framework imports. Graph operations, catalog schemas, and topology mapping live here. Everything is immutable and testable without React.

**Ports** -- interfaces that define how data enters and leaves the system. CatalogSource loads component metadata, TopologyExporter writes topology.json, GraphPersistence saves/loads graph state.

**Adapters** -- concrete implementations of ports. Currently file-based; designed to be swapped for Electron IPC or network adapters.

State management uses Zustand stores that call port methods through the composition root. UI components only import from stores, never from adapters directly.

## Output Format

The app produces `topology.json` for the diff framework:

```json
[
  { "type": "LinkEth", "id": "linkEth0", "dependencies": [], "config": {} },
  { "type": "MessageSource", "id": "msgSrc0", "dependencies": ["linkEth0"], "config": { "count": 3 } }
]
```

Each entry maps to a C++ component: `type` is the factory-registered class, `id` is a unique instance name, `dependencies` lists instance IDs matching constructor parameter order, and `config` holds typed key-value pairs for the component.

## Stack

Electron 35, React 19, TypeScript 5.8, Vite 6, MUI 7, Zustand 5, Zod 3.24
