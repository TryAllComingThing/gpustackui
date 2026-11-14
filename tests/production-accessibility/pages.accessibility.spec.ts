import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { mockAuthenticatedSession } from '../e2e/support/auth'

const productionRoutes = ['/dashboard', '/resources/nodes', '/models', '/deployments', '/services', '/settings', '/account/password']

test.beforeEach(async ({ page }) => {
  await mockAuthenticatedSession(page)
})

test('production fixture pages have no critical or serious axe violations', async ({ page }) => {
  for (const route of productionRoutes) {
    await page.goto(route, { waitUntil: 'networkidle' })
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const blocking = results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))
    expect(blocking, `${route}: ${JSON.stringify(blocking, null, 2)}`).toEqual([])
  }
})

test('mobile navigation exposes a modal boundary and keeps accessible link names', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dashboard', { waitUntil: 'networkidle' })

  await page.getByTestId('sidebar-toggle').click()
  const sidebar = page.getByTestId('app-sidebar')
  await expect(sidebar).toHaveAttribute('role', 'dialog')
  await expect(sidebar).toHaveAttribute('aria-modal', 'true')
  await expect(page.locator('.gp-app-header')).toHaveAttribute('inert', '')
  await expect(page.locator('.gp-app-main')).toHaveAttribute('inert', '')
  await expect(sidebar.getByRole('link', { name: '概览', exact: true })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByTestId('sidebar-toggle')).toBeFocused()
  await expect(page.locator('.gp-app-main')).not.toHaveAttribute('inert', '')
})

test('collapsed navigation preserves accessible names and preference panel keyboard behavior', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'networkidle' })
  const sidebar = page.getByTestId('app-sidebar')

  await page.getByTestId('sidebar-toggle').click()
  const dashboardLink = sidebar.getByRole('link', { name: '概览', exact: true })
  await expect(dashboardLink).toHaveAccessibleName('概览')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByTestId('preferences-toggle').click()
  await expect(page.locator('#production-theme')).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(page.locator('#production-preferences')).toBeHidden()
  await expect(page.getByTestId('preferences-toggle')).toBeFocused()
})
