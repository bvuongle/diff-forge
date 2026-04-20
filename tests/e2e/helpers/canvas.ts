import { Page } from '@playwright/test'

export async function installWorkspaceStub(page: Page, projectName = 'test-workspace') {
  await page.addInitScript((name) => {
    const status = { valid: true, projectName: name, cwd: `/tmp/${name}` }
    ;(window as unknown as { electronAPI: unknown }).electronAPI = {
      workspace: {
        status: async () => status,
        openAtPath: async () => ({ status: 'opened', workspace: status })
      },
      dialog: {
        openWorkspace: async () => ({ status: 'opened', workspace: status })
      },
      topology: {
        export: async () => ({ status: 'saved', topologyPath: `/tmp/${name}/topology.json`, projectName: name }),
        load: async () => ({ status: 'notFound' })
      }
    }
  }, projectName)
}

export async function waitForCanvasReady(page: Page) {
  await installWorkspaceStub(page)
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
  await page.mouse.move((sx + tx) / 2, (sy + ty) / 2, { steps: 8 })
  await page.mouse.move(tx, ty, { steps: 8 })
  await page.mouse.up()
}

export function edgeCount(page: Page) {
  return page.locator('.react-flow__edge').count()
}

export async function selectNode(page: Page, instanceId: string) {
  await page.getByRole('heading', { name: instanceId, exact: true }).click()
}

export async function toggleNode(page: Page, instanceId: string) {
  const node = page.locator(nodeSel(instanceId))
  await node.locator('.canvas-node__header button').click()
}
