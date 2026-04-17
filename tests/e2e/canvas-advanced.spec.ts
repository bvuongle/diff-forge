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

test.describe('Node drag repositioning', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth', { x: 500, y: 300 })
  })

  test('dragging a node changes its position', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'linkEth0' })
    const boxBefore = await heading.boundingBox()
    expect(boxBefore).toBeTruthy()

    const startX = boxBefore!.x + boxBefore!.width / 2
    const startY = boxBefore!.y + boxBefore!.height / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 150, startY + 100, { steps: 5 })
    await page.mouse.up()

    const boxAfter = await heading.boundingBox()
    expect(boxAfter).toBeTruthy()
    expect(boxAfter!.x).toBeGreaterThan(boxBefore!.x + 50)
    expect(boxAfter!.y).toBeGreaterThan(boxBefore!.y + 30)
  })
})

test.describe('Multi-node selection', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth', { x: 400, y: 200 })
    await dropCatalogComponent(page, 'MessageSource', { x: 400, y: 450 })
  })

  test('clicking a node does not dim other nodes', async ({ page }) => {
    await selectNode(page, 'linkEth0')
    await expect(page.locator(nodeSel('messageSource0'))).not.toHaveClass(/canvas-node--dimmed/)
  })

  test('clicking empty canvas clears selection', async ({ page }) => {
    await selectNode(page, 'linkEth0')
    await page.locator('.react-flow__pane').click({ position: { x: 50, y: 50 } })
    await expect(page.locator(nodeSel('linkEth0'))).not.toHaveClass(/canvas-node--selected/)
  })

  test('Meta+click adds to selection and Delete removes all', async ({ page }) => {
    await selectNode(page, 'linkEth0')
    await page.getByRole('heading', { name: 'messageSource0' }).click({ modifiers: ['Meta'] })
    
    await expect(page.locator(nodeSel('linkEth0'))).toHaveClass(/selected/)
    await expect(page.locator(nodeSel('messageSource0'))).toHaveClass(/selected/)

    await page.keyboard.press('Delete')
    await expect(page.locator(nodeSel('linkEth0'))).not.toBeVisible()
    await expect(page.locator(nodeSel('messageSource0'))).not.toBeVisible()
  })

  test('single Delete removes only the selected node', async ({ page }) => {
    await selectNode(page, 'linkEth0')
    await page.keyboard.press('Delete')
    await expect(page.locator(nodeSel('linkEth0'))).not.toBeVisible()
    await expect(page.locator(nodeSel('messageSource0'))).toBeVisible()
  })
})

test.describe('Edge selection', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth', { x: 400, y: 200 })
    await dropCatalogComponent(page, 'MessageSource', { x: 400, y: 450 })
    await connectPorts(page, outPortSel('linkEth0'), inPortSel('messageSource0', 'link'))
  })

  test('clicking an edge selects it', async ({ page }) => {
    const edge = page.locator('.react-flow__edge').first()
    // Target the hit area for more reliable clicking
    await edge.locator('.canvas-edge__hit-area').click({ force: true })
    await expect(edge).toHaveClass(/selected/)
  })
})

test.describe('Delete edge', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth', { x: 400, y: 200 })
    await dropCatalogComponent(page, 'MessageSource', { x: 400, y: 450 })
    await connectPorts(page, outPortSel('linkEth0'), inPortSel('messageSource0', 'link'))
  })

  test('selecting an edge and pressing Delete removes it', async ({ page }) => {
    const edge = page.locator('.react-flow__edge').first()
    await edge.locator('.canvas-edge__hit-area').click({ force: true })
    await page.keyboard.press('Delete')

    await expect(page.locator('.react-flow__edge')).toHaveCount(0)
    await expect(page.locator(nodeSel('linkEth0'))).toBeVisible()
    await expect(page.locator(nodeSel('messageSource0'))).toBeVisible()
  })
})

test.describe('Self-connection rejected', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'MessageSource', { x: 500, y: 300 })
  })

  test('dragging from output to own input does not create edge', async ({ page }) => {
    await connectPorts(page, outPortSel('messageSource0'), inPortSel('messageSource0', 'link'))
    expect(await edgeCount(page)).toBe(0)
  })
})

test.describe('Invalid connection rejected', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'Sensor', { x: 400, y: 200 })
    await dropCatalogComponent(page, 'MessageSource', { x: 400, y: 450 })
  })

  test('connecting incompatible interfaces does not create edge', async ({ page }) => {
    // Sensor implements IDataSource, MessageSource requires ILink
    await connectPorts(page, outPortSel('sensor0'), inPortSel('messageSource0', 'link'))
    expect(await edgeCount(page)).toBe(0)
  })
})

test.describe('Expanded node — Instance ID editing', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth')
  })

  test('editing instanceId in expanded mode updates the node name', async ({ page }) => {
    await toggleNode(page, 'linkEth0')
    
    const instanceIdField = page.getByLabel('Instance ID')
    await instanceIdField.fill('myCustomLink')
    await instanceIdField.blur()

    await expect(page.getByRole('heading', { name: 'myCustomLink' })).toBeVisible()
  })

  test('empty instanceId shows error', async ({ page }) => {
    await toggleNode(page, 'linkEth0')
    const instanceIdField = page.getByLabel('Instance ID')
    await instanceIdField.clear()
    await instanceIdField.blur()
    await expect(page.getByText('Cannot be empty')).toBeVisible()
  })
})

test.describe('Expanded node — config editing', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'MessageSource')
  })

  test('editing config field value persists across collapse/expand', async ({ page }) => {
    await toggleNode(page, 'messageSource0')

    const countField = page.getByLabel('count')
    await countField.fill('42')
    await countField.blur()

    // Collapse
    await toggleNode(page, 'messageSource0')
    await expect(page.getByText('CONFIGURATION')).not.toBeVisible()
    
    // Re-expand
    await toggleNode(page, 'messageSource0')
    await expect(page.getByLabel('count')).toHaveValue('42')
  })
})

test.describe('Expanded node — Fields/JSON toggle', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'MessageSource')
  })

  test('clicking JSON tab shows JSON editor', async ({ page }) => {
    await toggleNode(page, 'messageSource0')
    
    await page.getByRole('button', { name: 'JSON', exact: true }).click()
    await expect(page.locator('textarea').first()).toBeVisible()

    await page.getByRole('button', { name: 'Fields', exact: true }).click()
    await expect(page.getByLabel('count')).toBeVisible()
  })
})

test.describe('Canvas pan with mouse drag', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth', { x: 500, y: 300 })
  })

  test('dragging empty canvas area pans the view', async ({ page }) => {
    const viewport = page.locator('.react-flow__viewport')
    const transformBefore = await viewport.evaluate((el) => getComputedStyle(el).transform)

    const pane = page.locator('.react-flow__pane')
    await pane.hover({ position: { x: 10, y: 10 } })
    await page.mouse.down({ button: 'right' }) // pan usually bound to right/middle drag in select mode
    await page.mouse.move(100, 100, { steps: 5 })
    await page.mouse.up({ button: 'right' })

    const transformAfter = await viewport.evaluate((el) => getComputedStyle(el).transform)
    expect(transformAfter).not.toBe(transformBefore)
  })
})

test.describe('Fit to view button', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth', { x: 300, y: 200 })
    await dropCatalogComponent(page, 'MessageSource', { x: 700, y: 500 })
  })

  test('fit button adjusts view after zooming', async ({ page }) => {
    const zoomButton = page.getByRole('button', { name: 'Zoom presets' })
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await page.getByRole('button', { name: 'Zoom in' }).click()
    const zoomText = await zoomButton.innerText()
    
    await page.getByRole('button', { name: 'Fit to view' }).click()
    await expect(zoomButton).not.toHaveText(zoomText)
  })
})

test.describe('Multi-component workflow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
  })

  test('build topology: LinkEth + LinkGsm -> MessageSource with 2 edges', async ({ page }) => {
    await dropCatalogComponent(page, 'LinkEth', { x: 350, y: 200 })
    await dropCatalogComponent(page, 'LinkGsm', { x: 350, y: 400 })
    await dropCatalogComponent(page, 'MessageSource', { x: 650, y: 300 })

    await connectPorts(page, outPortSel('linkEth0'), inPortSel('messageSource0', 'link'))
    await connectPorts(page, outPortSel('linkGsm0'), inPortSel('messageSource0', 'backupLink'))

    expect(await edgeCount(page)).toBe(2)
  })

  test('selecting a connected node does not dim connected neighbors', async ({ page }) => {
    await dropCatalogComponent(page, 'LinkEth', { x: 350, y: 200 })
    await dropCatalogComponent(page, 'MessageSource', { x: 650, y: 300 })
    await connectPorts(page, outPortSel('linkEth0'), inPortSel('messageSource0', 'link'))

    await selectNode(page, 'messageSource0')
    await expect(page.locator(nodeSel('linkEth0'))).not.toHaveClass(/canvas-node--dimmed/)
  })
})

test.describe('Expand All / Collapse All buttons', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth', { x: 400, y: 200 })
    await dropCatalogComponent(page, 'MessageSource', { x: 400, y: 450 })
  })

  test('Expand All expands every node on canvas', async ({ page }) => {
    await page.getByRole('button', { name: 'Expand all nodes' }).click()
    await expect(page.getByText('INFO', { exact: true })).toHaveCount(2)
  })

  test('Collapse All collapses every expanded node', async ({ page }) => {
    await page.getByRole('button', { name: 'Expand all nodes' }).click()
    await expect(page.getByText('INFO', { exact: true })).toHaveCount(2)

    await page.getByRole('button', { name: 'Collapse all nodes' }).click()
    await expect(page.getByText('INFO', { exact: true })).toHaveCount(0)
  })
})

test.describe('Delete node removes connected edges', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
    await dropCatalogComponent(page, 'LinkEth', { x: 400, y: 200 })
    await dropCatalogComponent(page, 'MessageSource', { x: 400, y: 450 })
    await connectPorts(page, outPortSel('linkEth0'), inPortSel('messageSource0', 'link'))
  })

  test('deleting a connected node also removes its edges', async ({ page }) => {
    await expect(page.locator('.react-flow__edge')).toHaveCount(1)

    await selectNode(page, 'linkEth0')
    await page.keyboard.press('Delete')

    await expect(page.locator(nodeSel('linkEth0'))).not.toBeVisible()
    await expect(page.locator('.react-flow__edge')).toHaveCount(0)
  })
})
