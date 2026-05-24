import { readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import { test, expect } from '@playwright/test'

import { dropCatalogComponent } from './helpers/canvas'
import { FIXTURE_COMPONENT_TYPE } from './helpers/conanFixture'
import { launchPackagedAppWithFakeCatalog, type PackagedAppHarness } from './helpers/packagedApp'

let harness: PackagedAppHarness

test.describe.configure({ mode: 'serial' })

test.describe('Packaged app — env, catalog fetch, export', () => {
  test.beforeAll(async () => {
    harness = await launchPackagedAppWithFakeCatalog()
  })

  test.afterAll(async () => {
    await harness?.teardown()
  })

  test('catalog loads from the configured Artifactory env var', async () => {
    const page = harness.page
    await expect(page.getByText('Component Catalog')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(FIXTURE_COMPONENT_TYPE)).toBeVisible({ timeout: 20_000 })
    await page.screenshot({ path: 'tests/e2e/test-results/pkg-01-catalog.png' })
  })

  test('drag from catalog produces a canvas node', async () => {
    const page = harness.page
    await dropCatalogComponent(page, FIXTURE_COMPONENT_TYPE)
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10_000 })
    await page.screenshot({ path: 'tests/e2e/test-results/pkg-02-node.png' })
  })

  test('export writes the topology file to the workspace cwd', async () => {
    const page = harness.page
    const exportButton = page.getByRole('button', { name: /export topology/i }).first()
    await exportButton.click()

    const targetPath = join(harness.workspaceCwd, `${basename(harness.workspaceCwd)}.forge.json`)
    await expect
      .poll(
        () => {
          try {
            return readFileSync(targetPath, 'utf8')
          } catch {
            return ''
          }
        },
        { timeout: 15_000, intervals: [250, 500, 1000] }
      )
      .not.toBe('')

    const parsed = JSON.parse(readFileSync(targetPath, 'utf8'))
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBeGreaterThanOrEqual(1)
    expect(parsed[0].type).toBe(FIXTURE_COMPONENT_TYPE)
    await page.screenshot({ path: 'tests/e2e/test-results/pkg-03-export.png' })
  })
})
