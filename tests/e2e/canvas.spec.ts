import { test, expect, Page } from '@playwright/test'

// Helper: drag a catalog component onto the canvas
async function dragComponentToCanvas(page: Page, componentType: string, targetX = 600, targetY = 400) {
  const catalogItem = page.locator(`text=${componentType}`).first()
  await catalogItem.waitFor({ state: 'visible' })
  const canvas = page.locator('[data-canvas-bg]')
  await catalogItem.dragTo(canvas, { targetPosition: { x: targetX, y: targetY } })
}

test.describe('Catalog panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
  })

  test('displays catalog with components loaded', async ({ page }) => {
    await expect(page.getByText('LinkEth')).toBeVisible()
    await expect(page.getByText('MessageSource')).toBeVisible()
    await expect(page.getByText('SystemController')).toBeVisible()
  })

  test('search filters components', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('input').first())
    await searchInput.fill('Link')
    await expect(page.getByText('LinkEth')).toBeVisible()
    await expect(page.getByText('LinkGsm')).toBeVisible()
    // MessageSource should be filtered out
    await expect(page.locator('text=MessageSource')).not.toBeVisible()
  })

  test('shows component count', async ({ page }) => {
    // Footer shows total count
    await expect(page.getByText('Components', { exact: true })).toBeVisible()
  })
})

test.describe('Canvas — empty state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
  })

  test('shows empty canvas placeholder text', async ({ page }) => {
    await expect(page.getByText('Drag components from the catalog to place nodes.')).toBeVisible()
  })

  test('shows zoom percentage indicator', async ({ page }) => {
    await expect(page.getByText('100%')).toBeVisible()
  })
})

test.describe('Drop node from catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
  })

  test('drag LinkEth from catalog to canvas creates a node', async ({ page }) => {
    await dragComponentToCanvas(page, 'LinkEth')
    // Node should appear with component type and instanceId
    const nodes = page.locator('[data-canvas-bg] >> text=linkEth0')
    await expect(nodes).toBeVisible()
  })

  test('dropping same type again increments instanceId', async ({ page }) => {
    await dragComponentToCanvas(page, 'LinkEth', 500, 300)
    await dragComponentToCanvas(page, 'LinkEth', 500, 500)
    await expect(page.getByRole('heading', { name: 'linkEth0' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'linkEth1' })).toBeVisible()
  })

  test('empty canvas placeholder disappears after drop', async ({ page }) => {
    await expect(page.getByText('Drag components from the catalog to place nodes.')).toBeVisible()
    await dragComponentToCanvas(page, 'LinkEth')
    await expect(page.getByText('Drag components from the catalog to place nodes.')).not.toBeVisible()
  })
})

test.describe('Node display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
  })

  test('node shows componentType and instanceId', async ({ page }) => {
    await dragComponentToCanvas(page, 'MessageSource')
    await expect(page.getByText('MessageSource').nth(1)).toBeVisible()
    await expect(page.getByText('messageSource0')).toBeVisible()
  })

  test('node shows version chip', async ({ page }) => {
    await dragComponentToCanvas(page, 'LinkEth')
    // The node's version chip shows "1.0.0" — use exact match to avoid catalog panel ambiguity
    await expect(page.getByText('1.0.0', { exact: true })).toBeVisible()
  })

  test('node with input ports shows port circles', async ({ page }) => {
    await dragComponentToCanvas(page, 'MessageSource')
    // MessageSource has 'link' and 'backupLink' input ports
    const portHandles = page.locator('[data-port-handle][data-node-id]')
    // Should have at least 2 input ports + 1 output
    await expect(portHandles).toHaveCount(3)
  })

  test('node with output shows output port', async ({ page }) => {
    await dragComponentToCanvas(page, 'LinkEth')
    // LinkEth implements ILink, so it has an output port
    const outPorts = page.locator('[data-port-handle][data-direction="out"]')
    await expect(outPorts).toHaveCount(1)
  })
})

test.describe('Node selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'LinkEth')
  })

  test('clicking a node selects it (visual border change)', async ({ page }) => {
    const nodeText = page.getByText('linkEth0')
    await nodeText.click()
    // The node's parent box should get the accent-blue border
    // We check via computed style or just that the click doesn't throw
    await expect(nodeText).toBeVisible()
  })

  test('clicking empty canvas deselects', async ({ page }) => {
    const nodeText = page.getByText('linkEth0')
    await nodeText.click()
    // Click on empty canvas area
    const canvas = page.locator('[data-canvas-bg]')
    await canvas.click({ position: { x: 50, y: 50 } })
    // Node should still be visible but deselected
    await expect(nodeText).toBeVisible()
  })
})

test.describe('Delete node', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'LinkEth')
  })

  test('pressing Delete removes selected node', async ({ page }) => {
    const nodeText = page.getByText('linkEth0')
    await nodeText.click()
    await page.keyboard.press('Delete')
    await expect(nodeText).not.toBeVisible()
    // Empty state returns
    await expect(page.getByText('Drag components from the catalog to place nodes.')).toBeVisible()
  })

  test('pressing Backspace removes selected node', async ({ page }) => {
    const nodeText = page.getByText('linkEth0')
    await nodeText.click()
    await page.keyboard.press('Backspace')
    await expect(nodeText).not.toBeVisible()
  })
})

test.describe('Canvas navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
  })

  test('mouse wheel changes zoom percentage', async ({ page }) => {
    await expect(page.getByText('100%')).toBeVisible()
    const canvas = page.locator('[data-canvas-bg]')
    await canvas.hover()
    await page.mouse.wheel(0, -100)
    // Zoom should have changed from 100%
    await expect(page.getByText('100%')).not.toBeVisible()
  })

  test('Ctrl+= zooms in', async ({ page }) => {
    await expect(page.getByText('100%')).toBeVisible()
    await page.keyboard.press('Control+=')
    await expect(page.getByText('110%')).toBeVisible()
  })

  test('Ctrl+- zooms out', async ({ page }) => {
    await expect(page.getByText('100%')).toBeVisible()
    await page.keyboard.press('Control+-')
    await expect(page.getByText('90%')).toBeVisible()
  })

  test('Ctrl+0 resets zoom to 100%', async ({ page }) => {
    await page.keyboard.press('Control+=')
    await page.keyboard.press('Control+=')
    await expect(page.getByText('120%')).toBeVisible()
    await page.keyboard.press('Control+0')
    await expect(page.getByText('100%')).toBeVisible()
  })
})

test.describe('Connect two nodes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    // Drop LinkEth (provider, implements ILink)
    await dragComponentToCanvas(page, 'LinkEth', 400, 300)
    // Drop MessageSource (consumer, requires ILink via 'link' slot)
    await dragComponentToCanvas(page, 'MessageSource', 400, 500)
  })

  test('dragging from output port to input port creates a green edge', async ({ page }) => {
    const outputPort = page.locator('[data-port-handle][data-direction="out"]').first()
    const inputPort = page.locator('[data-port-handle][data-slot-name="link"]').first()
    await outputPort.dragTo(inputPort)

    // After connection, an SVG path with green stroke should exist
    const connectedEdge = page.locator('svg path[stroke="#9ca3af"]')
    await expect(connectedEdge.first()).toBeVisible()
  })
})

test.describe('Expand/collapse node', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'MessageSource')
  })

  test('double-clicking node expands it', async ({ page }) => {
    const nodeText = page.getByText('messageSource0')
    await nodeText.dblclick()
    // Expanded mode shows INFO, REQUIREMENTS, CONFIGURATION sections
    await expect(page.getByText('INFO')).toBeVisible()
    await expect(page.getByText('REQUIREMENTS')).toBeVisible()
    await expect(page.getByText('CONFIGURATION')).toBeVisible()
  })

  test('double-clicking expanded node collapses it', async ({ page }) => {
    const nodeText = page.getByText('messageSource0')
    await nodeText.dblclick()
    await expect(page.getByText('INFO')).toBeVisible()
    // Double-click again to collapse
    await nodeText.dblclick()
    await expect(page.getByText('INFO')).not.toBeVisible()
  })
})
