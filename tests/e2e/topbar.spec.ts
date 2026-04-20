import { expect, test } from '@playwright/test'

import { waitForCanvasReady } from './helpers/canvas'

test.describe('Topbar dialogs', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
  })

  test('opens hotkey reference dialog with all sections', async ({ page }) => {
    await page.getByRole('button', { name: /keyboard reference/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /keyboard & mouse reference/i })).toBeVisible()
    await expect(dialog.getByText(/^Project$/)).toBeVisible()
    await expect(dialog.getByText(/^Canvas$/)).toBeVisible()
    await expect(dialog.getByText(/^Catalog$/)).toBeVisible()
    await expect(dialog.getByText(/Export topology to/i)).toBeVisible()
    await expect(dialog.getByText(/Open \/ switch workspace folder/i)).toBeVisible()
  })

  test('hotkey dialog closes via close button', async ({ page }) => {
    await page.getByRole('button', { name: /keyboard reference/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /keyboard & mouse reference/i })).toBeVisible()
    await dialog.getByRole('button', { name: /^close$/i }).click()
    await expect(page.getByRole('heading', { name: /keyboard & mouse reference/i })).not.toBeVisible()
  })

  test('opens about dialog from info icon', async ({ page }) => {
    await page.getByRole('button', { name: /^about$/i }).click()
    await expect(page.getByRole('dialog').getByText(/about diff forge/i)).toBeVisible()
  })
})

test.describe('Topbar workspace chip', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
  })

  test('shows project name when workspace is valid', async ({ page }) => {
    const chip = page.getByRole('button', { name: /switch workspace/i })
    await expect(chip).toBeVisible()
  })
})

test.describe('App-level hotkeys', () => {
  test.beforeEach(async ({ page }) => {
    await waitForCanvasReady(page)
  })

  test('Cmd+S surfaces export feedback notification', async ({ page }) => {
    const isMac = process.platform === 'darwin'
    await page.keyboard.press(isMac ? 'Meta+S' : 'Control+S')
    await expect(page.getByRole('alert').filter({ hasText: /wrote topology\.json/i })).toBeVisible()
  })
})
