# Diff Forge

![Node](https://img.shields.io/badge/Node-22_LTS-339933?logo=node.js&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-42-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-7-007FFF?logo=mui&logoColor=white)

Desktop tool for visually composing C++ dependency graphs for the [diff](../diff) framework. Load component metadata from your Artifactory Conan repos, drag components onto a canvas, wire dependencies, and export the topology the C++ builder turns into a binary.

It is a single-user, CLI-launched tool. Run it from the project folder you want to write to — the app uses that folder (`process.cwd()`) as the workspace and writes `<project>.forge.json` there.

## Prerequisites

- **Node.js 22 LTS** and **pnpm 10** (`corepack enable`)
- **Artifactory access**, exported in the shell you launch from:

  ```bash
  export ARTIFACTORY_REPOS="https://artifactory.example.com/artifactory/diff-forge"  # comma-separated Conan API URLs
  export ARTIFACTORY_TOKEN="<read-only identity token>"
  ```

  Use a scoped, read-only Identity Token. Do not embed credentials in the URL.

> Env vars are read at startup from the launching shell. Launch from a terminal so the app inherits them.

## Install & run

### Install the release (Linux, Windows via WSL)

Download the latest `.deb` from the [Releases page](https://github.com/bvuongle/diff-forge/releases) — no need to build it yourself — and install it:

```bash
sudo apt install ./diff-forge_<version>_amd64.deb
```

Installing registers a `diff-forge` launcher. Run it from your project folder:

```bash
cd /path/to/your/project
diff-forge .
```

Windows: run these inside WSL2 (Ubuntu, with WSLg for the GUI).

### Run from source code

Clone the repository and navigate to the project folder:

```bash
git clone https://github.com/bvuongle/diff-forge.git
cd diff-forge
```

Run the dev server:

```bash
corepack enable
pnpm install
pnpm dev
```

## Scripts

| Script | What it does |
|--------|--------------|
| `pnpm dev` | Electron + Vite dev server |
| `pnpm build` | Production build (`dist/` + `dist-electron/`) |
| `pnpm test` | Vitest unit tests (`:watch`, `:coverage`, `:ui` variants) |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` / `pnpm format` | ESLint / Prettier (`:fix`, `:check` variants) |
| `pnpm dist` | Build + package the Linux `.deb` |

Husky runs ESLint + Prettier on staged `src/**/*.{ts,tsx}` before each commit.

## Troubleshooting

1. **Blank window, or a `chrome-sandbox` / "SUID sandbox" error on Linux or WSL.** Electron's Chrome sandbox needs a SUID `chrome-sandbox` binary and a writable `/dev/shm`, which are often missing under WSL or container setups. The installed `diff-forge` launcher detects this and falls back to `--no-sandbox` automatically. If you run the Electron binary directly, pass it yourself:

   ```bash
   diff-forge --no-sandbox .
   ```

2. **"Catalog source is unconfigured."** `ARTIFACTORY_REPOS` / `ARTIFACTORY_TOKEN` were not visible to the app. Export them in the terminal you launch from, then start the app from that same shell.