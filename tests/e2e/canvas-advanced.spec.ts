import { test, expect, Page } from '@playwright/test'

// Helper: drag a catalog component onto the canvas
async function dragComponentToCanvas(page: Page, componentType: string, targetX = 600, targetY = 400) {
  const catalogItem = page.locator(`text=${componentType}`).first()
  await catalogItem.waitFor({ state: 'visible' })
  const canvas = page.locator('[data-canvas-bg]')
  await catalogItem.dragTo(canvas, { targetPosition: { x: targetX, y: targetY } })
}

// Helper: get computed opacity of a node's outermost container by its instanceId.
// Walks up from the h6 heading and returns the lowest opacity found on any
// ancestor with cursor:grab (MUI Box wrapping the node).
async function getNodeOpacity(page: Page, instanceId: string): Promise<string> {
  return page.evaluate((id) => {
    const headings = document.querySelectorAll('h6')
    for (const h of headings) {
      if (h.textContent?.trim() === id) {
        let el: HTMLElement | null = h as HTMLElement
        let minOpacity = '1'
        while (el) {
          const s = getComputedStyle(el)
          if (s.cursor === 'grab' && parseFloat(s.opacity) < parseFloat(minOpacity)) {
            minOpacity = s.opacity
          }
          el = el.parentElement
        }
        return minOpacity
      }
    }
    return '1'
  }, instanceId)
}

test.describe('Node drag repositioning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'LinkEth', 500, 300)
  })

  test('dragging a node changes its position', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'linkEth0' })
    await expect(heading).toBeVisible()

    const boxBefore = await heading.boundingBox()
    expect(boxBefore).toBeTruthy()

    // Drag from the heading (non-port area)
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

test.describe('Multi-node selection dimming', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'LinkEth', 400, 200)
    await dragComponentToCanvas(page, 'MessageSource', 400, 450)
  })

  test('clicking a node dims unrelated nodes', async ({ page }) => {
    await page.getByRole('heading', { name: 'linkEth0' }).click()
    // Wait for CSS opacity transition (0.2s ease) to complete → target is 0.3
    await page.waitForFunction((id) => {
      const headings = document.querySelectorAll('h6')
      for (const h of headings) {
        if (h.textContent?.trim() === id) {
          let el: HTMLElement | null = h as HTMLElement
          while (el) {
            const s = getComputedStyle(el)
            if (s.cursor === 'grab' && parseFloat(s.opacity) < 0.5) return true
            el = el.parentElement
          }
        }
      }
      return false
    }, 'messageSource0', { timeout: 3000 })
    const opacity = await getNodeOpacity(page, 'messageSource0')
    expect(Number(opacity)).toBeLessThan(0.5)
  })

  test('clicking empty canvas restores all nodes to full opacity', async ({ page }) => {
    await page.getByRole('heading', { name: 'linkEth0' }).click()
    // Wait for dimming
    await page.waitForFunction((id) => {
      const headings = document.querySelectorAll('h6')
      for (const h of headings) {
        if (h.textContent?.trim() === id) {
          let el: HTMLElement | null = h as HTMLElement
          while (el) {
            const s = getComputedStyle(el)
            if (s.cursor === 'grab' && s.opacity !== '1') return true
            el = el.parentElement
          }
        }
      }
      return false
    }, 'messageSource0', { timeout: 3000 })

    // Click empty canvas to deselect
    const canvas = page.locator('[data-canvas-bg]')
    await canvas.click({ position: { x: 50, y: 50 } })

    // Wait for opacity to restore — all grab-cursor ancestors should be opacity 1
    await page.waitForFunction((id) => {
      const headings = document.querySelectorAll('h6')
      for (const h of headings) {
        if (h.textContent?.trim() === id) {
          let el: HTMLElement | null = h as HTMLElement
          while (el) {
            const s = getComputedStyle(el)
            if (s.cursor === 'grab' && s.opacity !== '1') return false
            el = el.parentElement
          }
          return true
        }
      }
      return false
    }, 'messageSource0', { timeout: 3000 })
    expect(await getNodeOpacity(page, 'messageSource0')).toBe('1')
  })

  test('connected nodes are NOT dimmed when one is selected', async ({ page }) => {
    // Connect LinkEth → MessageSource
    const outputPort = page.locator('[data-port-handle][data-direction="out"]').first()
    const inputPort = page.locator('[data-port-handle][data-slot-name="link"]').first()
    await outputPort.dragTo(inputPort)

    // Select LinkEth
    await page.getByRole('heading', { name: 'linkEth0' }).click()

    // MessageSource is connected — should NOT be dimmed
    const opacity = await getNodeOpacity(page, 'messageSource0')
    expect(opacity).not.toBe('0.3')
  })
})

test.describe('Edge selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'LinkEth', 400, 200)
    await dragComponentToCanvas(page, 'MessageSource', 400, 450)
    const outputPort = page.locator('[data-port-handle][data-direction="out"]').first()
    const inputPort = page.locator('[data-port-handle][data-slot-name="link"]').first()
    await outputPort.dragTo(inputPort)
  })

  test('clicking an edge selects it and highlights both connected nodes', async ({ page }) => {
    const edgePath = page.locator('svg g path[stroke="#9ca3af"]').first()
    await expect(edgePath).toBeVisible()

    const edgeGroup = page.locator('svg g').filter({ has: page.locator('path[stroke="#9ca3af"]') }).first()
    await edgeGroup.click()

    const blueEdge = page.locator('svg path[stroke="var(--accent-blue)"]')
    await expect(blueEdge.first()).toBeVisible()
  })
})

test.describe('Delete edge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'LinkEth', 400, 200)
    await dragComponentToCanvas(page, 'MessageSource', 400, 450)
    const outputPort = page.locator('[data-port-handle][data-direction="out"]').first()
    const inputPort = page.locator('[data-port-handle][data-slot-name="link"]').first()
    await outputPort.dragTo(inputPort)
  })

  test('selecting an edge and pressing Delete removes it', async ({ page }) => {
    const connectedEdge = page.locator('svg path[stroke="#9ca3af"]')
    await expect(connectedEdge.first()).toBeVisible()

    const edgeGroup = page.locator('svg g').filter({ has: page.locator('path[stroke="#9ca3af"]') }).first()
    await edgeGroup.click()
    await page.keyboard.press('Delete')

    await expect(connectedEdge).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'linkEth0' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'messageSource0' })).toBeVisible()
  })
})

test.describe('Self-connection rejected', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'MessageSource', 500, 300)
  })

  test('dragging from output to own input does not create edge', async ({ page }) => {
    const outputPort = page.locator('[data-port-handle][data-direction="out"]').first()
    const inputPort = page.locator('[data-port-handle][data-slot-name="link"]').first()
    await outputPort.dragTo(inputPort)

    const connectedEdge = page.locator('svg path[stroke="#9ca3af"]')
    await expect(connectedEdge).toHaveCount(0)
  })
})

test.describe('Invalid connection rejected', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'Sensor', 400, 200)
    await dragComponentToCanvas(page, 'MessageSource', 400, 450)
  })

  test('connecting incompatible interfaces does not create edge', async ({ page }) => {
    const outputPort = page.locator('[data-port-handle][data-direction="out"]').first()
    const inputPort = page.locator('[data-port-handle][data-slot-name="link"]').first()
    await outputPort.dragTo(inputPort)

    const connectedEdge = page.locator('svg path[stroke="#9ca3af"]')
    await expect(connectedEdge).toHaveCount(0)
  })
})

test.describe('Expanded node — Instance ID editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'LinkEth')
  })

  test('editing instanceId in expanded mode updates the node name', async ({ page }) => {
    await page.getByRole('heading', { name: 'linkEth0' }).dblclick()
    await expect(page.getByText('INFO')).toBeVisible()

    const instanceIdField = page.getByLabel('Instance ID')
    await instanceIdField.clear()
    await instanceIdField.fill('myCustomLink')
    await instanceIdField.blur()

    await expect(page.getByRole('heading', { name: 'myCustomLink' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'linkEth0' })).not.toBeVisible()
  })

  test('empty instanceId shows error', async ({ page }) => {
    await page.getByRole('heading', { name: 'linkEth0' }).dblclick()

    const instanceIdField = page.getByLabel('Instance ID')
    await instanceIdField.clear()
    await instanceIdField.blur()

    await expect(page.getByText('Cannot be empty')).toBeVisible()
  })
})

test.describe('Expanded node — config editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'MessageSource')
  })

  test('editing config field value persists across collapse/expand', async ({ page }) => {
    const nodeText = page.getByRole('heading', { name: 'messageSource0' })
    await nodeText.dblclick()
    await expect(page.getByText('CONFIGURATION')).toBeVisible()

    const countField = page.getByLabel('count')
    await countField.clear()
    await countField.fill('42')

    // Collapse and re-expand
    await nodeText.dblclick()
    await expect(page.getByText('CONFIGURATION')).not.toBeVisible()
    await nodeText.dblclick()
    await expect(page.getByText('CONFIGURATION')).toBeVisible()

    await expect(page.getByLabel('count')).toHaveValue('42')
  })
})

test.describe('Expanded node — version switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'Sensor')
  })

  test('switching version changes config fields', async ({ page }) => {
    await page.getByRole('heading', { name: 'sensor0' }).dblclick()
    await expect(page.getByText('CONFIGURATION')).toBeVisible()

    await expect(page.getByLabel('sampleRate')).toBeVisible()
    await expect(page.getByLabel('calibrationOffset')).not.toBeVisible()

    const versionSelect = page.getByLabel('Version')
    await versionSelect.click()
    await page.getByRole('option', { name: '2.0.0' }).click()

    await expect(page.getByLabel('calibrationOffset')).toBeVisible()
    await expect(page.getByText('isCalibrated')).toBeVisible()
  })
})

test.describe('Expanded node — Fields/JSON toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'MessageSource')
  })

  test('clicking JSON tab shows JSON editor', async ({ page }) => {
    await page.getByRole('heading', { name: 'messageSource0' }).dblclick()
    await expect(page.getByText('CONFIGURATION')).toBeVisible()
    await expect(page.getByLabel('count')).toBeVisible()

    // Use exact match to avoid ambiguity with other "JSON" text on page
    const jsonTab = page.getByRole('button', { name: 'JSON', exact: true })
    await jsonTab.click()

    const jsonTextarea = page.locator('textarea')
    await expect(jsonTextarea.first()).toBeVisible()

    const fieldsTab = page.getByRole('button', { name: 'Fields', exact: true })
    await fieldsTab.click()
    await expect(page.getByLabel('count')).toBeVisible()
  })
})

test.describe('Canvas pan with mouse drag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'LinkEth', 500, 300)
  })

  test('dragging empty canvas area pans the view', async ({ page }) => {
    const canvasBg = page.locator('[data-canvas-bg]')

    // Get the transform before pan
    const transformBefore = await canvasBg.evaluate(
      (el) => getComputedStyle(el).transform
    )

    // Click on the data-canvas-bg element (empty area away from the node)
    const bgBox = await canvasBg.boundingBox()
    expect(bgBox).toBeTruthy()

    // Start from a point far from any node
    const startX = bgBox!.x + 100
    const startY = bgBox!.y + 50
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX - 120, startY - 80, { steps: 5 })
    await page.mouse.up()

    // The CSS transform on data-canvas-bg should have changed
    const transformAfter = await canvasBg.evaluate(
      (el) => getComputedStyle(el).transform
    )
    expect(transformAfter).not.toBe(transformBefore)
  })
})

test.describe('Fit to view button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
  })

  test('fit button adjusts view after zooming', async ({ page }) => {
    await dragComponentToCanvas(page, 'LinkEth', 300, 200)
    await dragComponentToCanvas(page, 'MessageSource', 700, 500)

    await page.keyboard.press('Control+=')
    await page.keyboard.press('Control+=')
    await expect(page.getByText('120%')).toBeVisible()

    const fitButton = page.getByRole('button', { name: 'Fit' })
    await fitButton.click()

    await expect(page.getByText('120%')).not.toBeVisible()
  })

  test('Ctrl+0 resets view after panning and zooming', async ({ page }) => {
    await dragComponentToCanvas(page, 'LinkEth', 500, 300)

    await page.keyboard.press('Control+=')
    await expect(page.getByText('110%')).toBeVisible()

    await page.keyboard.press('Control+0')
    await expect(page.getByText('100%')).toBeVisible()
  })

  test('Reset button resets zoom to 100% and pan to origin', async ({ page }) => {
    await dragComponentToCanvas(page, 'LinkEth', 500, 300)

    await page.keyboard.press('Control+=')
    await page.keyboard.press('Control+=')
    await expect(page.getByText('120%')).toBeVisible()

    const resetButton = page.getByRole('button', { name: 'Reset' })
    await resetButton.click()

    await expect(page.getByText('100%')).toBeVisible()
  })
})

test.describe('Multi-component workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
  })

  test('build topology: LinkEth + LinkGsm -> MessageSource with 2 green edges', async ({ page }) => {
    await dragComponentToCanvas(page, 'LinkEth', 350, 200)
    await dragComponentToCanvas(page, 'LinkGsm', 350, 400)
    await dragComponentToCanvas(page, 'MessageSource', 650, 300)

    await expect(page.getByRole('heading', { name: 'linkEth0' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'linkGsm0' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'messageSource0' })).toBeVisible()

    // Connect LinkEth → MessageSource.link
    const linkEthOutput = page.locator('[data-port-handle][data-direction="out"][data-node-id="linkEth0"]')
    const msgLink = page.locator('[data-port-handle][data-slot-name="link"][data-node-id="messageSource0"]')
    await linkEthOutput.dragTo(msgLink)

    // Connect LinkGsm → MessageSource.backupLink
    const linkGsmOutput = page.locator('[data-port-handle][data-direction="out"][data-node-id="linkGsm0"]')
    const msgBackupLink = page.locator('[data-port-handle][data-slot-name="backupLink"][data-node-id="messageSource0"]')
    await linkGsmOutput.dragTo(msgBackupLink)

    const connectedEdges = page.locator('svg path[stroke="#9ca3af"]')
    await expect(connectedEdges).toHaveCount(2)
  })

  test('selecting a connected node does not dim connected neighbors', async ({ page }) => {
    await dragComponentToCanvas(page, 'LinkEth', 350, 200)
    await dragComponentToCanvas(page, 'MessageSource', 650, 300)

    const linkEthOutput = page.locator('[data-port-handle][data-direction="out"][data-node-id="linkEth0"]')
    const msgLink = page.locator('[data-port-handle][data-slot-name="link"][data-node-id="messageSource0"]')
    await linkEthOutput.dragTo(msgLink)

    // Select MessageSource — LinkEth is connected, so not dimmed
    await page.getByRole('heading', { name: 'messageSource0' }).click()

    const opacity = await getNodeOpacity(page, 'linkEth0')
    expect(opacity).not.toBe('0.3')
  })
})

test.describe('Expand All / Collapse All buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'LinkEth', 400, 200)
    await dragComponentToCanvas(page, 'MessageSource', 400, 450)
  })

  test('Expand All expands every node on canvas', async ({ page }) => {
    await page.getByRole('button', { name: 'Expand All' }).click()
    const infoSections = page.getByText('INFO', { exact: true })
    await expect(infoSections).toHaveCount(2)
  })

  test('Collapse All collapses every expanded node', async ({ page }) => {
    await page.getByRole('button', { name: 'Expand All' }).click()
    await expect(page.getByText('INFO', { exact: true })).toHaveCount(2)

    await page.getByRole('button', { name: 'Collapse All' }).click()
    await expect(page.getByText('INFO', { exact: true })).toHaveCount(0)
  })
})

test.describe('Delete node removes connected edges', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Component Catalog')
    await dragComponentToCanvas(page, 'LinkEth', 400, 200)
    await dragComponentToCanvas(page, 'MessageSource', 400, 450)
    const outputPort = page.locator('[data-port-handle][data-direction="out"]').first()
    const inputPort = page.locator('[data-port-handle][data-slot-name="link"]').first()
    await outputPort.dragTo(inputPort)
  })

  test('deleting a connected node also removes its edges', async ({ page }) => {
    const connectedEdge = page.locator('svg path[stroke="#9ca3af"]')
    await expect(connectedEdge.first()).toBeVisible()

    await page.getByRole('heading', { name: 'linkEth0' }).click()
    await page.keyboard.press('Delete')

    await expect(page.getByRole('heading', { name: 'linkEth0' })).not.toBeVisible()
    await expect(connectedEdge).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'messageSource0' })).toBeVisible()
  })
})
