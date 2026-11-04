import { expect, test } from '@playwright/test'

const THEME_HOVER: Record<string, string> = {
  standard: '#0C5EEB',
  business: '#1451AE',
  future: '#2F59EE',
  sky: '#1265D1',
  ocean: '#1664A4',
}
const DENSITY_GEOMETRY: Record<string, Record<string, string>> = {
  compact: { control: '32px', row: '36px', card: '12px', content: '20px' },
  standard: { control: '36px', row: '44px', card: '20px', content: '24px' },
  comfortable: { control: '40px', row: '52px', card: '24px', content: '32px' },
}

test('production shell, adapters, themes, density, and responsive navigation work', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/dashboard', { waitUntil: 'networkidle' })
  await expect(page.locator('.gp-sidebar-nav')).toHaveCount(1)
  await expect(page.locator('[data-testid="breadcrumb"]')).toHaveCount(1)
  await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('概览')

  await page.getByRole('button', { name: '折叠导航' }).click()
  await expect(page.locator('.gp-sidebar-nav')).toHaveAttribute('data-collapsed', 'true')
  await page.locator('.gp-sidebar-nav a[href="/dashboard"]').first().hover()
  await expect(page.getByRole('tooltip').filter({ hasText: '概览' })).toBeVisible()

  await page.goto('/resources/gpus', { waitUntil: 'networkidle' })
  await expect(page.locator('.gp-data-table')).toHaveCount(1)
  await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('GPU 资源')
  await page.getByRole('button', { name: '按 名称 排序' }).click()

  for (const [theme, hover] of Object.entries(THEME_HOVER)) {
    await page.selectOption('#production-theme', theme)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    const tokens = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement)
      return {
        brand500: styles.getPropertyValue('--gp-brand-g500').trim().toUpperCase(),
        hover: styles.getPropertyValue('--gp-primary-hover').trim().toUpperCase(),
        motion: styles.getPropertyValue('--gp-motion-standard').trim(),
      }
    })
    expect(tokens.brand500).toBe(hover)
    expect([hover, 'VAR(--GP-BRAND-G500)']).toContain(tokens.hover)
    expect(['160ms', '.16s']).toContain(tokens.motion)
  }

  for (const [density, expected] of Object.entries(DENSITY_GEOMETRY)) {
    await page.selectOption('#production-density', density)
    await expect(page.locator('html')).toHaveAttribute('data-density', density)
    const geometry = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement)
      return {
        control: styles.getPropertyValue('--gp-control-height').trim(),
        row: styles.getPropertyValue('--gp-table-row-height').trim(),
        card: styles.getPropertyValue('--gp-card-padding').trim(),
        content: styles.getPropertyValue('--gp-content-padding').trim(),
      }
    })
    expect(geometry).toEqual(expected)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dashboard', { waitUntil: 'networkidle' })
  await expect(page.locator('.gp-app-shell')).toHaveAttribute('data-collapsed', 'true')
  await page.getByRole('button', { name: '展开导航' }).click()
  await expect(page.locator('.gp-app-shell')).toHaveAttribute('data-collapsed', 'false')
  expect(errors).toEqual([])
})
