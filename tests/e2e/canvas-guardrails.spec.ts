import { test, expect, Page } from '@playwright/test'

async function dragComponentToCanvas(page: Page, componentType: string, targetX = 600, targetY = 400) {
  const catalogItem = page.locator(`text=${componentType}`).first()
  await catalogItem.waitFor({ state: 'visible' })
  const canvas = page.locator('[data-canvas-bg]')
  await catalogItem.dragTo(canvas, { targetPosition: { x: targetX, y: targetY } })
}

test.describe('Ctrl+A selects all nodes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'LinkEth', 400, 200)
    await dragComponentToCanvas(page, 'MessageSource', 400, 450)
  })

  test('Ctrl+A selects all nodes on canvas', async ({ page }) => {
    await page.keyboard.press('Control+a')
    // Both nodes should show selected border
    const selectedNodes = page.locator('.canvas-node--selected')
    await expect(selectedNodes).toHaveCount(2)
  })

  test('Meta+A selects all nodes on Mac', async ({ page }) => {
    await page.keyboard.press('Meta+a')
    const selectedNodes = page.locator('.canvas-node--selected')
    await expect(selectedNodes).toHaveCount(2)
  })
})

test.describe('Space toggles canvas mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
  })

  test('Space key toggles from select to pan mode', async ({ page }) => {
    // Default mode is select — the Select button should be active
    const selectBtn = page.getByRole('button', { name: 'Select' })
    const panBtn = page.getByRole('button', { name: 'Pan' })

    // Press Space to toggle to pan
    await page.keyboard.down('Space')
    // Pan button should now be highlighted
    await expect(panBtn).toHaveAttribute('aria-pressed', 'true')

    // Release Space to restore select
    await page.keyboard.up('Space')
    await expect(selectBtn).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('Snap-to-grid toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
  })

  test('snap toggle button exists in toolkit', async ({ page }) => {
    const snapBtn = page.getByRole('button', { name: 'Snap' })
    await expect(snapBtn).toBeVisible()
  })

  test('toggling snap does not break node placement', async ({ page }) => {
    const snapBtn = page.getByRole('button', { name: 'Snap' })
    await snapBtn.click()
    await dragComponentToCanvas(page, 'LinkEth')
    await expect(page.getByRole('heading', { name: 'linkEth0' })).toBeVisible()
  })
})

test.describe('Toolbar buttons present', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
  })

  test('all toolkit buttons are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Select' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pan' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Fit' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Snap' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Expand All' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Collapse All' })).toBeVisible()
  })
})

test.describe('Max connections enforced', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
  })

  test('cannot connect two sources to a max-1 slot', async ({ page }) => {
    await dragComponentToCanvas(page, 'LinkEth', 300, 200)
    await dragComponentToCanvas(page, 'LinkGsm', 300, 400)
    await dragComponentToCanvas(page, 'MessageSource', 650, 300)

    // Connect LinkEth -> MessageSource.link (max 1)
    const linkEthOut = page.locator('[data-port-handle][data-direction="out"][data-node-id="linkEth0"]')
    const msgLink = page.locator('[data-port-handle][data-slot-name="link"][data-node-id="messageSource0"]')
    await linkEthOut.dragTo(msgLink)

    // Try connecting LinkGsm -> same slot (should fail, max 1)
    const linkGsmOut = page.locator('[data-port-handle][data-direction="out"][data-node-id="linkGsm0"]')
    await linkGsmOut.dragTo(msgLink)

    // Should still only have 1 edge to the 'link' slot
    const edges = page.locator('svg path[stroke="#9ca3af"]')
    // 1 edge to 'link', no second edge there
    await expect(edges).toHaveCount(1)
  })
})

test.describe('Canvas app title', () => {
  test('renders Diff Forge title in topbar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Diff Forge')).toBeVisible()
  })
})
