import { expect, test } from '@playwright/test'

test('loads the practice workspace', async ({ page }) => {
  await page.goto('/accent-coach/')
  await expect(page.getByRole('heading', { name: 'Accent Coach' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Record/i })).toBeVisible()
  await expect(page.getByRole('img', { name: /formant/i })).toBeVisible()
})
