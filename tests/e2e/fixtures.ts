import { fileURLToPath } from 'node:url'

import { _electron, test as base, type ElectronApplication, type Page } from '@playwright/test'

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url))

const MOCK_CATALOG = {
  status: 'ready' as const,
  catalog: {
    components: [
      {
        type: 'LinkEth',
        source: 'mock',
        version: '1.0.0',
        implements: ['ILink'],
        requires: [],
        config: {}
      },
      {
        type: 'LinkGsm',
        source: 'mock',
        version: '1.0.0',
        implements: ['ILink'],
        requires: [],
        config: {}
      },
      {
        type: 'MessageSource',
        source: 'mock',
        version: '1.0.0',
        implements: ['IProcessable'],
        requires: [
          { name: 'link', type: 'ILink', isArray: false },
          { name: 'backupLink', type: 'ILink', isArray: false }
        ],
        config: {
          count: { type: 'uint32' as const, min: 1, max: 1000, default: 10 },
          content: { type: 'string' as const, default: 'default message' }
        }
      },
      {
        type: 'SystemController',
        source: 'mock',
        version: '1.0.0',
        implements: ['IMonitorable'],
        requires: [
          { name: 'workers', type: 'IProcessable', isArray: true },
          { name: 'monitors', type: 'IMonitorable', isArray: true }
        ],
        config: {}
      },
      {
        type: 'Sensor',
        source: 'mock',
        version: '1.0.0',
        implements: ['IDataSource'],
        requires: [],
        config: {
          sampleRate: { type: 'uint' as const, min: 1, max: 10000, default: 100 }
        }
      }
    ]
  },
  repos: []
}

const MOCK_WORKSPACE_STATUS = {
  valid: true as const,
  name: 'test-workspace',
  cwd: '/tmp/test-workspace'
}

const MOCK_OPEN_RESULT = {
  status: 'opened' as const,
  workspace: MOCK_WORKSPACE_STATUS
}

const MOCK_RESPONSES = {
  'catalog:load': MOCK_CATALOG,
  'workspace:status': MOCK_WORKSPACE_STATUS,
  'dialog:openWorkspace': MOCK_OPEN_RESULT,
  'workspace:openAtPath': MOCK_OPEN_RESULT,
  'topology:export': {
    status: 'saved' as const,
    topologyPath: '/tmp/test-workspace/test-workspace.forge.json',
    name: 'test-workspace'
  },
  'topology:load': { status: 'notFound' as const }
}

type TestFixtures = {
  electronApp: ElectronApplication
  page: Page
}

export const test = base.extend<TestFixtures>({
  electronApp: async ({}, use) => {  // eslint-disable-line no-empty-pattern
    const installedBin = process.env.DIFF_FORGE_BIN
    const launchOptions = installedBin
      ? { executablePath: installedBin, args: ['--no-sandbox'] }
      : { args: [PROJECT_ROOT, '--no-sandbox'] }
    const app = await _electron.launch({
      ...launchOptions,
      env: { ...process.env, HEADLESS: '1' },
      timeout: 30_000
    })
    await app.evaluate(({ ipcMain }, mocks) => {
      for (const channel of Object.keys(mocks)) {
        try {
          ipcMain.removeHandler(channel)
        } catch {
          /* not registered */
        }
        ipcMain.handle(channel, () => mocks[channel as keyof typeof mocks])
      }
    }, MOCK_RESPONSES)
    await use(app)
    await app.close()
  },
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow({ timeout: 30_000 })
    await use(page)
  }
})

export { expect } from '@playwright/test'
