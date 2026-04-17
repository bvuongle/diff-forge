import { Page } from '@playwright/test'

export async function waitForCanvasReady(page: Page) {
  await page.goto('/')
  await page.waitForSelector('text=Component Catalog')
  await page.waitForSelector('.react-flow__pane')
}

export function nodeSel(id: string) {
  return `.react-flow__node[data-id="${id}"]`
}

export function outPortSel(id: string) {
  return `${nodeSel(id)} .react-flow__handle[data-handlepos="right"]`
}

export function inPortSel(id: string, slot: string) {
  return `${nodeSel(id)} .react-flow__handle[data-handlepos="left"][data-handleid="${slot}"]`
}

/**
 * Drag a catalog item onto the React Flow pane by dispatching real HTML5
 * drag events with the custom application/x-diff-component payload.
 * targetPosition is relative to the pane bounding box.
 */
export async function dropCatalogComponent(
  page: Page,
  componentType: string,
  targetPosition: { x: number; y: number } = { x: 500, y: 300 }
) {
  const catalogItem = page.locator(`text=${componentType}`).first()
  await catalogItem.waitFor({ state: 'visible' })
  const pane = page.locator('.react-flow__pane')
  const paneBox = await pane.boundingBox()
  if (!paneBox) throw new Error('pane has no bounding box')
  const clientX = paneBox.x + targetPosition.x
  const clientY = paneBox.y + targetPosition.y

  // Read the JSON payload straight out of the catalog item's onDragStart by
  // synthesising a dragstart, reading dataTransfer, and forwarding it.
  const payload = await catalogItem.evaluate((el) => {
    const dt = new DataTransfer()
    const start = new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt })
    el.dispatchEvent(start)
    return dt.getData('application/x-diff-component')
  })
  if (!payload) throw new Error(`catalog drag payload missing for "${componentType}"`)

  await pane.evaluate(
    (el, { cx, cy, data }) => {
      const dt = new DataTransfer()
      dt.setData('application/x-diff-component', data)
      dt.effectAllowed = 'copy'
      const common = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, dataTransfer: dt }
      el.dispatchEvent(new DragEvent('dragenter', common))
      el.dispatchEvent(new DragEvent('dragover', common))
      el.dispatchEvent(new DragEvent('drop', common))
    },
    { cx: clientX, cy: clientY, data: payload }
  )
}

/**
 * Draw a connection between two React Flow handles using real mouse events.
 * React Flow's connection engine listens to mousedown/move/up, so this works.
 */
export async function connectPorts(page: Page, sourceSelector: string, targetSelector: string) {
  const src = page.locator(sourceSelector)
  const tgt = page.locator(targetSelector)
  const sBox = await src.boundingBox()
  const tBox = await tgt.boundingBox()
  if (!sBox || !tBox) throw new Error('port bounding box missing')
  const sx = sBox.x + sBox.width / 2
  const sy = sBox.y + sBox.height / 2
  const tx = tBox.x + tBox.width / 2
  const ty = tBox.y + tBox.height / 2
  await page.mouse.move(sx, sy)
  await page.mouse.down()
  // Multi-step move lets React Flow paint the pending edge.
  await page.mouse.move((sx + tx) / 2, (sy + ty) / 2, { steps: 8 })
  await page.mouse.move(tx, ty, { steps: 8 })
  await page.mouse.up()
}

/** Count the real React Flow edges (ignores the pending connection line). */
export function edgeCount(page: Page) {
  return page.locator('.react-flow__edge').count()
}

/** Select a node by clicking its heading. */
export async function selectNode(page: Page, instanceId: string) {
  await page.getByRole('heading', { name: instanceId, exact: true }).click()
}

/** Expand or collapse a node by clicking its header button. */
export async function toggleNode(page: Page, instanceId: string) {
  const node = page.locator(nodeSel(instanceId))
  await node.locator('.canvas-node__header button').click()
}
