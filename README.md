# diff-forge

![Electron](https://img.shields.io/badge/Electron-36-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-7-007FFF?logo=mui&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-000000?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=)
![React Flow](https://img.shields.io/badge/React_Flow-12-FF0072?logo=reactflow&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3.24-3E67B1?logo=zod&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-e2e-2EAD33?logo=playwright&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)
![Node](https://img.shields.io/badge/Node-22_LTS-339933?logo=node.js&logoColor=white)

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
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier write |

Husky runs ESLint + Prettier as a pre-commit hook.

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
  src/
    adapters/                 Contract implementations (FileCatalogSource, JsonTopologyExporter, FileGraphPersistence)
    assets/                   Static + mock catalog data
    components/
      canvas/                 React Flow canvas, nodes, edges, hooks, toolkit
      catalog/                Left catalog panel + search
      layout/                 MainLayout shell
      topbar/                 App topbar
    contracts/                Contract interfaces (CatalogSource, TopologyExporter, GraphPersistence)
    domain/                   Pure TypeScript: zero framework imports
      catalog/                Schemas + types (Zod)
      graph/                  Types, operations, validation (cycles, orphans, invalid edges)
      topology/               Topology types + mapper
    electron/                 Main process + preload
    state/                    Zustand stores + cross-store reconciler
    styles/                   Global CSS, design tokens, BEM styles, MUI theme
    testing/                  Shared fixtures + test utilities
    App.tsx, main.tsx         Entry point
    compositionRoot.ts        AppServices wiring
  tests/
    e2e/                      Playwright specs
    snapshots/                Topology + catalog schema snapshots
```

## Architecture

The app follows a layered architecture with explicit contracts between layers.

**Domain** — pure TypeScript with no framework imports. Graph operations, validation (cycle/orphan detection), catalog schemas, and topology mapping. Everything immutable and testable without React.

**Contracts** — interfaces that define how data enters and leaves the system. `CatalogSource` loads component metadata, `TopologyExporter` writes `topology.json`, `GraphPersistence` saves/loads project state.

**Adapters** — concrete implementations of contracts. File-based today, wired through Electron IPC.

**State** — Zustand stores (`catalogStore`, `graphStore`, `uiStore`) plus a reconciler (`stateSubscriptions.ts`) that keeps derived ID sets in sync when nodes or edges are removed. UI components read from stores; they never import adapters directly.

**Canvas** — built on [React Flow](https://reactflow.dev) (`@xyflow/react`). Custom node and edge renderers live in `components/canvas/nodes` and `components/canvas/edges`. Interaction logic is split into hooks (`useCanvasConnection`, `useCanvasHotkeys`, `useCanvasState`, `useCatalogDrop`). Styling uses BEM CSS with design tokens — no `sx` props for structural styles.

## Output Format

The app produces `topology.json` for the diff framework:

```json
[
  { "type": "LinkEth", "id": "linkEth0", "dependencies": [], "config": {} },
  { "type": "MessageSource", "id": "msgSrc0", "dependencies": ["linkEth0"], "config": { "count": 3 } }
]
```

Each entry maps to a C++ component: `type` is the factory-registered class, `id` is a unique instance name, `dependencies` lists instance IDs matching constructor parameter order, and `config` holds typed key-value pairs for the component.
