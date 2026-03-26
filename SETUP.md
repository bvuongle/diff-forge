# diff-forge Setup Guide

Production application for visually composing C++ dependency graphs using the diff framework.

## Prerequisites

- **Node.js 22 LTS** — [Download](https://nodejs.org/)
- **pnpm 10** — Installed via corepack (included with Node 18+)

## Quick Start

### 1. Enable Corepack

Corepack comes with Node.js and manages pnpm versions automatically.

```bash
corepack enable
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Development

Start the dev server with hot-reload:

```bash
pnpm dev
```

This launches Electron with the Vite dev server running on localhost:5173.

### 4. Build

Create production bundles:

```bash
pnpm build
```

Output:
- `dist/` — React/Vite bundle
- `dist-electron/` — Electron main & preload processes

### 5. Preview

Preview production build locally:

```bash
pnpm preview
```

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Start dev server with Electron |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run Vitest unit tests |
| `pnpm test:e2e` | Run Playwright end-to-end tests |
| `pnpm typecheck` | Run TypeScript compiler check |

## Stack Versions (March 2026)

| Package | Version |
|---------|---------|
| Node | 22 LTS |
| pnpm | 10.6.5 |
| Electron | 35.x |
| React | 19 |
| TypeScript | 5.8 |
| Vite | 6 |
| MUI | 7 |
| Zustand | 5 |
| Zod | 3.24 |

## Architecture

**Hexagonal (Ports & Adapters)** design separates business logic from infrastructure:

```
Domain Layer (Pure)
├── catalog/ — Component definitions
├── graph/ — Graph operations
└── topology/ — Diff framework format

Ports Layer (Interfaces)
├── CatalogSource
├── TopologyExporter
└── GraphPersistence

Adapters (Implementations)
├── FileCatalogSource
├── JsonTopologyExporter
└── FileGraphPersistence

State (Zustand)
├── catalogStore
├── graphStore
└── uiStore

UI (React + MUI)
└── layout/ & components/
```

## Project Structure

```
diff-forge/
├── electron/              Electron main & preload
├── src/
│   ├── domain/            Business logic (pure functions)
│   ├── ports/             Port interfaces
│   ├── adapters/          Adapter implementations
│   ├── state/             Zustand stores
│   ├── ui/                React components
│   ├── styles/            Global styles & theme
│   ├── assets/            Mock data & resources
│   ├── app/               Composition root & App component
│   └── main.tsx           React entry point
├── index.html             HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── .npmrc                 pnpm configuration
```

## TypeScript Configuration

- **Strict mode**: All strict checks enabled
- **No `any` types**: TypeScript enforces explicit typing
- **Path aliases**: Use `@domain`, `@ports`, `@state`, `@ui` for imports

Example:
```typescript
import { Graph } from '@domain/graph/GraphTypes'
import { useGraphStore } from '@state/graphStore'
```

## Development Notes

### Composition Root

Adapt `src/app/compositionRoot.ts` to wire ports to real implementations:
- Connect `mockLoadFile` / `mockSaveFile` to Electron IPC
- Implement proper catalog loading from files or remote sources

### File I/O in Electron Context

Use Electron's `ipcMain` / `ipcRenderer` for file operations:
1. Preload script (`electron/preload.ts`) exposes `window.electronAPI`
2. Call `window.electronAPI.catalog.load()` from React components
3. Main process (`electron/main.ts`) handles IPC and filesystem access

### Mock Data

Development uses `src/assets/mock/catalog.v0.json` with sample diff_broker components:
- LinkEth, LinkGsm, LinkSat (implement ILink)
- MessageSource (implements IProcessable, requires 2x ILink)

Replace with real catalog when connected to actual C++ module exports.

## Testing

### Unit Tests

```bash
pnpm test
```

Uses **Vitest** with React Testing Library. Tests are located alongside source files (*.test.ts).

### E2E Tests

```bash
pnpm test:e2e
```

Uses **Playwright** for browser automation tests.

## Common Tasks

### Add a New Component Type

1. Update `src/assets/mock/catalog.v0.json`
2. Tests pass automatically via Zod schema validation

### Add a New Zustand Store

Create `src/state/newStore.ts`:
```typescript
import { create } from 'zustand'

type NewStore = { /* your state */ }

const useNewStore = create<NewStore>((set) => ({
  // implementation
}))

export { useNewStore }
```

### Add a New Port

1. Create interface in `src/ports/NewPort.ts`
2. Implement adapter in `src/adapters/NewAdapter.ts`
3. Wire in `src/app/compositionRoot.ts`

## Troubleshooting

### Vite dev server not loading

Ensure `VITE_DEV_SERVER_URL` is set in Electron's environment. Check `electron/main.ts`.

### Preload script errors

Verify `contextIsolation: true` and `nodeIntegration: false` in `webPreferences`.

### Module resolution issues

Check `tsconfig.json` path aliases match `vite.config.ts` aliases.

## Further Reading

- [Electron Docs](https://www.electronjs.org/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [React 19 Docs](https://react.dev)
- [MUI Documentation](https://mui.com)
- [Zustand Guide](https://github.com/pmndrs/zustand)
