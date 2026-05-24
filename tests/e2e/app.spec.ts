import { test, expect } from './fixtures'

test('app launches and renders the topbar + catalog panel', async ({ page }) => {
  await expect(page.getByRole('banner').getByText('Diff Forge', { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Component Catalog')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Export Topology' })).toBeVisible()
})
