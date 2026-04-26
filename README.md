# Diff Forge

![Electron](https://img.shields.io/badge/Electron-35-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-7-007FFF?logo=mui&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-000000)
![React Flow](https://img.shields.io/badge/React_Flow-12-FF0072?logo=reactflow&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3.24-3E67B1?logo=zod&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-e2e-2EAD33?logo=playwright&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)
![Node](https://img.shields.io/badge/Node-22_LTS-339933?logo=node.js&logoColor=white)

Desktop tool for visually composing C++ dependency graphs consumed by the [diff](../diff) framework. Load component metadata from one or more Artifactory Conan repositories, drag components onto a canvas, wire dependencies, export a `topology.json` the C++ builder turns into a binary.

This is a single-user, CLI-launched workflow tool. Run it from the project folder you want to write the topology to; the app uses `process.cwd()` as the workspace.

## Prerequisites

- Node.js 22 LTS
- pnpm 10 (via corepack: `corepack enable`)
- Artifactory access. Set these in your shell before launch:
  - `DF_ARTIFACTORY_REPOS` - comma-separated Conan API URLs (e.g. `https://artifactory.example.com/artifactory/diff-forge`)
  - `DF_ARTIFACTORY_TOKEN` - bearer token. Recommended: a scoped Identity Token with read-only access to the catalog repos. Do not embed credentials in the URL itself.

## Running the app

### From source (development)

```bash
corepack enable
pnpm install
pnpm dev
```

Spawns Electron with the Vite dev server on `localhost:5173`, HMR enabled. The renderer reads catalog over IPC; the main process owns Artifactory + filesystem.

### From a release build

After installing the packaged build (see [Releasing](#releasing) below):

```bash
export DF_ARTIFACTORY_REPOS="https://artifactory.example.com/artifactory/diff-forge"
export DF_ARTIFACTORY_TOKEN="<your token>"
cd /path/to/your/project
diff-forge .
```

## Scripts

| Script | What it does |
|--------|--------------|
| `pnpm dev` | Electron + Vite dev server with HMR |
| `pnpm build` | Production build (`dist/` + `dist-electron/`) |
| `pnpm preview` | Preview the production renderer locally |
| `pnpm test` | Vitest unit tests |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:coverage` | Unit tests with coverage |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier write |
| `pnpm dist` | Build + electron-builder for current platform |
| `pnpm dist:mac` / `:linux` / `:win` | Per-platform package |

Husky runs ESLint + Prettier on staged `src/**/*.{ts,tsx}` as a pre-commit hook.

## Project layout

```
diff-forge/
  src/
    adapters/        Implementations of contracts
    assets/          
    components/      React UI
    contracts/       Interfaces
    core/            Core logic
    electron/        Main process + preload bridge
    state/           Zustand stores + orchestrators
    styles/          CSS and MUI theme
    testing/         Shared fixtures + test utilities
    App.tsx, main.tsx
  tests/e2e/         Playwright specs
```

## Releasing

Targets:
- macOS (Apple Silicon): `.dmg`, `.zip`
- Linux (x64): `.AppImage`, `.deb`
- Windows (x64): NSIS `.exe`

