import { readFile, stat, writeFile } from 'fs/promises'
import { homedir } from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

import { app, BrowserWindow, dialog, ipcMain } from 'electron'

import { createArtifactoryRestFetcher } from '../adapters/ArtifactoryRestFetcher'
import { createFsCatalogCache } from '../adapters/FsCatalogCache'
import type { CatalogCache, RepoFetchRecord } from '../contracts/CatalogCache'
import type { CatalogRepoFetcher, RepoFetchResult } from '../contracts/CatalogRepoFetcher'
import { parseEnv, REPOS_VAR, TOKEN_VAR, type RepoConfig } from '../domain/catalog/envRepos'
import { mergeCatalogs } from '../domain/catalog/mergeCatalogs'
import { checkWorkspace } from '../domain/workspace/workspaceContext'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

let mainWindow: BrowserWindow | null = null

type ProjectPaths = { topologyPath: string; projectName: string }

function projectPaths(projectName: string): ProjectPaths {
  const cwd = process.cwd()
  return {
    projectName,
    topologyPath: path.join(cwd, `${projectName}.forge.json`)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.handle('workspace:status', async () => {
  return checkWorkspace(process.cwd(), homedir())
})

ipcMain.handle('dialog:openWorkspace', async () => {
  if (!mainWindow) {
    return { status: 'error', message: 'Window not ready' }
  }
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select workspace folder'
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { status: 'canceled' }
    }
    const picked = result.filePaths[0]
    process.chdir(picked)
    return { status: 'opened', workspace: checkWorkspace(process.cwd(), homedir()) }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
})

function expandTilde(target: string): string {
  if (target === '~') return homedir()
  if (target.startsWith('~/')) return path.join(homedir(), target.slice(2))
  return target
}

ipcMain.handle('workspace:openAtPath', async (_event, payload: { path: string }) => {
  const raw = payload?.path?.trim()
  if (!raw) return { status: 'error', message: 'Path is empty' }
  const target = expandTilde(raw)
  if (!path.isAbsolute(target)) {
    return { status: 'error', message: 'Path must be absolute (start with / or ~)' }
  }
  try {
    const info = await stat(target)
    if (!info.isDirectory()) {
      return { status: 'error', message: 'Path is not a directory' }
    }
    process.chdir(target)
    return { status: 'opened', workspace: checkWorkspace(process.cwd(), homedir()) }
  } catch (err) {
    const code = err instanceof Error && 'code' in err ? (err as NodeJS.ErrnoException).code : ''
    if (code === 'ENOENT') return { status: 'error', message: 'Directory does not exist' }
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
})

ipcMain.handle('topology:export', async (_event, payload: { topology: string }) => {
  const status = checkWorkspace(process.cwd(), homedir())
  if (!status.valid) return { status: 'invalidWorkspace', reason: status.reason }

  const paths = projectPaths(status.projectName)
  try {
    await writeFile(paths.topologyPath, payload.topology, 'utf8')
    return {
      status: 'saved',
      topologyPath: paths.topologyPath,
      projectName: paths.projectName
    }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
})

async function tryRead(target: string): Promise<string | null> {
  try {
    return await readFile(target, 'utf8')
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw err
  }
}

ipcMain.handle('topology:load', async () => {
  const status = checkWorkspace(process.cwd(), homedir())
  if (!status.valid) return { status: 'notFound' }

  const paths = projectPaths(status.projectName)
  try {
    const topology = await tryRead(paths.topologyPath)
    if (topology === null) return { status: 'notFound' }
    return {
      status: 'loaded',
      topology,
      topologyPath: paths.topologyPath
    }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
})

let catalogCache: CatalogCache | null = null
let repoFetcher: CatalogRepoFetcher | null = null

async function handleCatalogLoad() {
  const env = parseEnv(process.env)
  if (env.status === 'unconfigured') {
    return { status: 'unconfigured', missing: env.missing }
  }
  if (env.status === 'invalid') {
    return { status: 'error', message: env.message, repos: [] }
  }
  if (!catalogCache) return { status: 'error', message: 'Catalog cache not initialized', repos: [] }

  const snapshot = await catalogCache.read()
  const repoSummaries = env.repos.map((r) => {
    const record = snapshot.repos.find((rec) => rec.slug === r.slug)
    return (
      record ?? {
        url: r.url,
        slug: r.slug,
        state: { status: 'failed' as const, reason: 'never-fetched' }
      }
    )
  })

  if (snapshot.merged) {
    const anyFailed = repoSummaries.some((r) => r.state.status === 'failed')
    if (anyFailed) {
      return {
        status: 'partial',
        catalog: JSON.stringify(snapshot.merged),
        repos: repoSummaries,
        message: 'Some repositories were never fetched. Using cached catalog.'
      }
    }
    return { status: 'ready', catalog: JSON.stringify(snapshot.merged), repos: repoSummaries }
  }

  return {
    status: 'error',
    message: 'No cached catalog yet. Click Refresh to fetch from configured repositories.',
    repos: repoSummaries
  }
}

async function handleCatalogRefresh() {
  const env = parseEnv(process.env)
  if (env.status === 'unconfigured') {
    return { status: 'unconfigured', missing: env.missing }
  }
  if (env.status === 'invalid') {
    return { status: 'error', message: env.message, repos: [] }
  }
  if (!catalogCache || !repoFetcher) {
    return { status: 'error', message: 'Catalog services not initialized', repos: [] }
  }

  const results = await Promise.all(env.repos.map((repo: RepoConfig) => repoFetcher!.fetch(repo, env.token)))

  const successes = results.filter((r): r is Extract<RepoFetchResult, { status: 'ok' }> => r.status === 'ok')
  const failures = results.filter((r): r is Extract<RepoFetchResult, { status: 'failed' }> => r.status === 'failed')

  const records: RepoFetchRecord[] = results.map((r) =>
    r.status === 'ok'
      ? { slug: r.slug, url: r.url, state: { status: 'ok' } }
      : { slug: r.slug, url: r.url, state: { status: 'failed', reason: r.reason } }
  )
  await catalogCache.writeRepos(records)

  if (successes.length === 0) {
    return {
      status: 'error',
      message: `All ${failures.length} repositories failed to refresh. See repo details.`,
      repos: records
    }
  }

  const merged = mergeCatalogs(successes.map((s) => s.catalog))
  await catalogCache.writeMerged(merged)

  if (failures.length === 0) {
    return { status: 'ready', catalog: JSON.stringify(merged), repos: records }
  }
  return {
    status: 'partial',
    catalog: JSON.stringify(merged),
    repos: records,
    message: `${failures.length} of ${results.length} repositories failed. Showing partial catalog.`
  }
}

ipcMain.handle('catalog:load', handleCatalogLoad)
ipcMain.handle('catalog:refresh', handleCatalogRefresh)

function reportStartupEnv(): void {
  const config = parseEnv(process.env)
  if (config.status === 'unconfigured') {
    // Intentional CLI stderr: user launched from terminal; no UI yet to show this.
    // eslint-disable-next-line no-console
    console.error(
      `[diff-forge] ${REPOS_VAR} is not set. Catalog will be empty until configured.\n` +
        `Example:\n` +
        `  export ${REPOS_VAR}="https://repo.example/artifactory/conan-repo"\n` +
        `  export ${TOKEN_VAR}="<optional-bearer-token>"\n` +
        `Then relaunch: diff_forge .`
    )
  }
}

app.on('ready', () => {
  catalogCache = createFsCatalogCache({ baseDir: app.getPath('userData') })
  repoFetcher = createArtifactoryRestFetcher({ fetch })
  reportStartupEnv()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
