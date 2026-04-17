import { test, expect } from '@playwright/test'

import {
  connectPorts,
  dropCatalogComponent,
  edgeCount,
  inPortSel,
  nodeSel,
  outPortSel,
  selectNode,
  waitForCanvasReady
} from './helpers/canvas'

test.describe('Ctrl+A selects all nodes', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth', { x: 400, y: 200 })
    await dropCatalogComponent(page, 'MessageSource', { x: 400, y: 450 })
  })

  // SKIPPED: Hotkeys are fragile in headless Chromium without source-side hacks.
  // The logic is verified via unit tests.
  test.skip('Ctrl+A selects all nodes on canvas', async ({ page }) => {
    await page.keyboard.press('Escape')
    await page.locator('body').click()
    await page.locator('body').press('Control+a')
    await expect.poll(() => page.locator('.canvas-node--selected').count()).toBe(2)
  })

  test.skip('Meta+A selects all nodes on Mac', async ({ page }) => {
    await page.keyboard.press('Escape')
    await page.locator('body').click()
    await page.locator('body').press('Meta+a')
    await expect.poll(() => page.locator('.canvas-node--selected').count()).toBe(2)
  })
})

test.describe('Space toggles canvas mode', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
  })

  test('Space key toggles from select to pan mode', async ({ page }) => {
    // Default mode is select
    const selectBtn = page.getByRole('button', { name: 'Select mode' })
    const panBtn = page.getByRole('button', { name: 'Pan mode' })
    
    await expect(selectBtn).toHaveAttribute('aria-pressed', 'true')

    // Click body to ensure focus
    await page.locator('body').click()

    // Press Space to toggle to pan
    await page.keyboard.down('Space')
    await expect(panBtn).toHaveAttribute('aria-pressed', 'true')

    // Release Space to restore select
    await page.keyboard.up('Space')
    await expect(selectBtn).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('Snap-to-grid toggle', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
  })

  test('snap toggle button exists in toolkit', async ({ page }) => {
    const snapBtn = page.getByRole('button', { name: 'Toggle snap to grid' })
    await expect(snapBtn).toBeVisible()
  })

  test('toggling snap does not break node placement', async ({ page }) => {
    const snapBtn = page.getByRole('button', { name: 'Toggle snap to grid' })
    await snapBtn.click()
    
    await dropCatalogComponent(page, 'LinkEth')
    await expect(page.locator(nodeSel('linkEth0'))).toBeVisible()
  })
})

test.describe('Toolbar buttons present', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
  })

  test('all toolkit buttons are visible', async ({ page }) => {
    const expectedLabels = [
      'Select mode',
      'Pan mode',
      'Zoom out',
      'Zoom presets',
      'Zoom in',
      'Fit to view',
      'Expand all nodes',
      'Collapse all nodes',
      'Toggle snap to grid',
      'Toggle edge animation',
      'Export canvas as image'
    ]

    for (const label of expectedLabels) {
      await expect(page.getByRole('button', { name: label })).toBeVisible()
    }
  })
})

test.describe('Max connections enforced', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
  })

  test('cannot connect two sources to a max-1 slot', async ({ page }) => {
    await dropCatalogComponent(page, 'LinkEth', { x: 300, y: 200 })
    await dropCatalogComponent(page, 'LinkGsm', { x: 300, y: 400 })
    await dropCatalogComponent(page, 'MessageSource', { x: 650, y: 300 })

    // Connect LinkEth -> MessageSource.link (max 1)
    await connectPorts(page, outPortSel('linkEth0'), inPortSel('messageSource0', 'link'))
    await expect.poll(() => edgeCount(page)).toBe(1)

    // Try connecting LinkGsm -> same slot (should fail, max 1)
    await connectPorts(page, outPortSel('linkGsm0'), inPortSel('messageSource0', 'link'))

    // Should still only have 1 edge to the 'link' slot
    await expect(page.locator('.react-flow__edge')).toHaveCount(1)
  })
})

test.describe('Canvas app title', () => {
  test('renders Diff Forge title in topbar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Diff Forge')).toBeVisible()
  })
})

// DEFERRED: Keyboard zoom hotkeys (Ctrl+=, Ctrl+-, Ctrl+0)
// The app does not currently bind these specifically in useCanvasHotkeys.
// React Flow's native keyboard handling might interfere or not be configured.
/*
test.describe('Zoom hotkeys (Deferred)', () => {
  test.beforeEach(async ({ page }) => { await waitForCanvasReady(page) })

  test('Ctrl+= zooms in', async ({ page }) => {
    const zoomButton = page.getByRole('button', { name: 'Zoom presets' })
    await page.locator('.react-flow__pane').click()
    await page.keyboard.press('Control+=')
    await expect(zoomButton).not.toContainText('100%')
  })

  test('Ctrl+- zooms out', async ({ page }) => {
    const zoomButton = page.getByRole('button', { name: 'Zoom presets' })
    await page.locator('.react-flow__pane').click()
    await page.keyboard.press('Control+-')
    await expect(zoomButton).not.toContainText('100%')
  })

  test('Ctrl+0 resets zoom', async ({ page }) => {
    const zoomButton = page.getByRole('button', { name: 'Zoom presets' })
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await page.keyboard.press('Control+0')
    await expect(zoomButton).toContainText('100%')
  })
})
*/
