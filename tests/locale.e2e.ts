import { expect, test } from '@playwright/test'

test('locale switching, persistence, html lang, and translated labels', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('概览')

  await page.selectOption('#production-locale', 'en-US')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
  await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('Overview')
  await expect(page.locator('.gp-sidebar-nav')).toHaveAttribute('aria-label', 'Primary navigation')

  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
  await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('Overview')

  await page.goto('/resources/gpus', { waitUntil: 'networkidle' })
  await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('GPU Resources')
  await page.getByRole('button', { name: 'Sort by Name' }).click()

  await page.selectOption('#production-locale', 'zh-CN')
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('GPU 资源')
})
