import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'

import { type FakeConanServer, startFakeConanServer } from './fakeConanServer'

export type PackagedAppHarness = {
  app: ElectronApplication
  page: Page
  workspaceCwd: string
  server: FakeConanServer
  teardown: () => Promise<void>
}

export async function launchPackagedAppWithFakeCatalog(): Promise<PackagedAppHarness> {
  const bin = process.env.DIFF_FORGE_BIN
  if (!bin) throw new Error('DIFF_FORGE_BIN env var is required for the packaged-app project')

  const workspaceCwd = mkdtempSync(join(tmpdir(), 'forge-pkg-'))
  const server = await startFakeConanServer('fake-repo')

  const app = await electron.launch({
    executablePath: bin,
    args: ['--no-sandbox'],
    cwd: workspaceCwd,
    env: {
      ...process.env,
      ARTIFACTORY_REPOS: server.url,
      ARTIFACTORY_TOKEN: ''
    },
    timeout: 30_000
  })

  const page = await app.firstWindow({ timeout: 30_000 })
  await page.waitForLoadState('domcontentloaded')

  const teardown = async () => {
    try {
      await app.close()
    } catch {
      /* app may already be closed */
    }
    await server.close().catch(() => undefined)
    try {
      rmSync(workspaceCwd, { recursive: true, force: true })
    } catch {
      /* best-effort */
    }
  }

  return { app, page, workspaceCwd, server, teardown }
}
