import { test, expect } from '@playwright/test'

import {
  connectPorts,
  dropCatalogComponent,
  edgeCount,
  inPortSel,
  nodeSel,
  outPortSel,
  selectNode,
  toggleNode,
  waitForCanvasReady
} from './helpers/canvas'

test.describe('Catalog panel', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
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
    await expect(page.locator('text=MessageSource')).not.toBeVisible()
  })

  test('shows component count', async ({ page }) => {
    await expect(page.getByText('Components', { exact: true })).toBeVisible()
  })
})

test.describe('Canvas — empty state', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
  })

  test('shows empty canvas placeholder text', async ({ page }) => {
    await expect(page.getByText('Drag components from the catalog to place nodes.')).toBeVisible()
  })

  test('shows zoom percentage indicator', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Zoom presets' })).toContainText('100%')
  })
})

test.describe('Drop node from catalog', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
  })

  test('drag LinkEth from catalog to canvas creates a node', async ({ page }) => {
    await dropCatalogComponent(page, 'LinkEth')
    await expect(page.locator(nodeSel('linkEth0'))).toBeVisible()
  })

  test('dropping same type again increments instanceId', async ({ page }) => {
    await dropCatalogComponent(page, 'LinkEth', { x: 500, y: 300 })
    await dropCatalogComponent(page, 'LinkEth', { x: 500, y: 500 })
    await expect(page.locator(nodeSel('linkEth0'))).toBeVisible()
    await expect(page.locator(nodeSel('linkEth1'))).toBeVisible()
  })

  test('empty canvas placeholder disappears after drop', async ({ page }) => {
    await expect(page.getByText('Drag components from the catalog to place nodes.')).toBeVisible()
    await dropCatalogComponent(page, 'LinkEth')
    await expect(page.getByText('Drag components from the catalog to place nodes.')).not.toBeVisible()
  })
})

test.describe('Node display', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
  })

  test('node shows componentType and instanceId', async ({ page }) => {
    await dropCatalogComponent(page, 'MessageSource')
    const node = page.locator(nodeSel('messageSource0'))
    await expect(node).toContainText('MessageSource')
    await expect(node).toContainText('messageSource0')
  })

  test('node shows version chip', async ({ page }) => {
    await dropCatalogComponent(page, 'LinkEth')
    await expect(page.locator(nodeSel('linkEth0'))).toContainText('1.0.0')
  })

  test('node with input ports shows port circles', async ({ page }) => {
    await dropCatalogComponent(page, 'MessageSource')
    const portHandles = page.locator(nodeSel('messageSource0')).locator('.react-flow__handle')
    await expect(portHandles).toHaveCount(3)
  })

  test('node with output shows output port', async ({ page }) => {
    await dropCatalogComponent(page, 'LinkEth')
    await expect(page.locator(outPortSel('linkEth0'))).toHaveCount(1)
  })
})

test.describe('Node selection', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth')
  })

  test('clicking a node selects it (visual border change)', async ({ page }) => {
    await selectNode(page, 'linkEth0')
    await expect(page.locator(nodeSel('linkEth0'))).toHaveClass(/selected/)
  })

  test('clicking empty canvas deselects', async ({ page }) => {
    await selectNode(page, 'linkEth0')
    await page.locator('.react-flow__pane').click({ position: { x: 50, y: 50 } })
    await expect(page.locator(nodeSel('linkEth0'))).not.toHaveClass(/selected/)
  })
})

test.describe('Delete node', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth')
  })

  test('pressing Delete removes selected node', async ({ page }) => {
    await selectNode(page, 'linkEth0')
    await page.keyboard.press('Delete')
    await expect(page.locator(nodeSel('linkEth0'))).not.toBeVisible()
    await expect(page.getByText('Drag components from the catalog to place nodes.')).toBeVisible()
  })

  test('pressing Backspace removes selected node', async ({ page }) => {
    await selectNode(page, 'linkEth0')
    await page.keyboard.press('Backspace')
    await expect(page.locator(nodeSel('linkEth0'))).not.toBeVisible()
  })
})

test.describe('Canvas navigation', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
  })

  test('mouse wheel changes zoom percentage', async ({ page }) => {
    const zoomButton = page.getByRole('button', { name: 'Zoom presets' })
    await expect(zoomButton).toContainText('100%')
    
    await page.locator('.react-flow__pane').hover()
    await page.mouse.wheel(0, -100)
    
    await expect(zoomButton).not.toContainText('100%')
  })

  test('Zoom in button changes zoom percentage', async ({ page }) => {
    const zoomButton = page.getByRole('button', { name: 'Zoom presets' })
    await expect(zoomButton).toContainText('100%')
    
    await page.getByRole('button', { name: 'Zoom in' }).click()
    
    await expect(zoomButton).not.toContainText('100%')
  })

  test('Zoom out button changes zoom percentage', async ({ page }) => {
    const zoomButton = page.getByRole('button', { name: 'Zoom presets' })
    await expect(zoomButton).toContainText('100%')
    
    await page.getByRole('button', { name: 'Zoom out' }).click()
    
    await expect(zoomButton).not.toContainText('100%')
  })
})

test.describe('Connect two nodes', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth', { x: 400, y: 300 })
    await dropCatalogComponent(page, 'MessageSource', { x: 400, y: 500 })
  })

  test('dragging from output port to input port creates an edge', async ({ page }) => {
    await connectPorts(page, outPortSel('linkEth0'), inPortSel('messageSource0', 'link'))
    await expect.poll(() => edgeCount(page)).toBe(1)
  })
})

test.describe('Expand/collapse node', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'MessageSource')
  })

  test('clicking node toggle button expands it', async ({ page }) => {
    await toggleNode(page, 'messageSource0')
    const node = page.locator(nodeSel('messageSource0'))
    await expect(node.getByText('INFO')).toBeVisible()
    await expect(node.getByText('REQUIREMENTS')).toBeVisible()
    await expect(node.getByText('CONFIGURATION')).toBeVisible()
  })

  test('clicking node toggle button collapses it', async ({ page }) => {
    await toggleNode(page, 'messageSource0')
    await expect(page.locator(nodeSel('messageSource0')).getByText('INFO')).toBeVisible()
    
    await toggleNode(page, 'messageSource0')
    await expect(page.locator(nodeSel('messageSource0')).getByText('INFO')).not.toBeVisible()
  })
})
