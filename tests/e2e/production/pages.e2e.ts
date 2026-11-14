import { expect, test } from '@playwright/test'
import { mockAuthenticatedSession } from '../support/auth'

const fixtureRoutes = [
  { path: '/dashboard', testId: 'production-dashboard', expected: ['GPU 利用率', '68%'] },
  { path: '/resources/nodes', testId: 'production-node-status', expected: ['node-01', 'node-05', '离线'] },
  { path: '/models', testId: 'production-models', expected: ['Llama 3.1 8B', 'DeepSeek V3'] },
  { path: '/deployments', testId: 'production-deployments', expected: ['production-llama', 'embedding-batch'] },
  { path: '/services', testId: 'production-services', expected: ['llama-chat', 'rerank-api'] },
  { path: '/settings', testId: 'production-settings', expected: ['standard', '简体中文'] },
]

test.beforeEach(async ({ page }) => {
  await mockAuthenticatedSession(page)
})

test('all business pages render deterministic fixtures without business API calls', async ({ page }) => {
  const businessRequests: string[] = []
  const errors: string[] = []
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname
    if (path.startsWith('/v2/')) businessRequests.push(path)
  })
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))

  for (const route of fixtureRoutes) {
    await page.goto(route.path, { waitUntil: 'networkidle' })
    const pageRoot = page.getByTestId(route.testId)
    await expect(pageRoot).toBeVisible()
    await expect(page.getByTestId('fixture-notice')).toContainText('本地示例数据')
    for (const text of route.expected) await expect(pageRoot).toContainText(text)
  }

  expect([...new Set(businessRequests)]).toEqual(['/v2/users/me'])
  expect(errors).toEqual([])
})

test('theme, density, and locale preferences update frontend state and translate pages', async ({ page }) => {
  await page.goto('/settings', { waitUntil: 'networkidle' })

  for (const theme of ['standard', 'business', 'future', 'sky', 'ocean']) {
    await page.selectOption('#settings-theme', theme)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await expect(page.locator('#production-theme')).toHaveValue(theme)
    await expect(page.getByTestId('settings-theme-value')).toContainText(theme)
  }

  for (const density of ['compact', 'standard', 'comfortable']) {
    await page.selectOption('#settings-density', density)
    await expect(page.locator('html')).toHaveAttribute('data-density', density)
    await expect(page.locator('#production-density')).toHaveValue(density)
    await expect(page.getByTestId('settings-density-value')).not.toBeEmpty()
  }

  for (const appearance of ['light', 'dark']) {
    await page.selectOption('#settings-appearance', appearance)
    await expect(page.locator('html')).toHaveAttribute('data-appearance', appearance)
    await expect(page.locator('html')).toHaveCSS('color-scheme', appearance)
    await expect(page.locator('#production-appearance')).toHaveValue(appearance)
    await expect(page.getByTestId('settings-appearance-value')).not.toBeEmpty()
  }
  await expect(page.locator('html')).toHaveClass(/(?:^|\s)dark(?:\s|$)/)

  await page.selectOption('#settings-locale', 'en-US')
  await expect(page.locator('#production-locale')).toHaveValue('en-US')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.getByTestId('fixture-notice')).toContainText('Local fixture data')
  await expect(page.getByTestId('settings-locale-value')).toHaveText('English')

  await page.goto('/models', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: 'Model Services' })).toBeVisible()
  await expect(page.getByTestId('production-models')).toContainText('Provider')

  await page.selectOption('#production-locale', 'zh-CN')
  await expect(page.getByRole('heading', { name: '模型服务' })).toBeVisible()
})

test('keyboard activation and narrow viewport keep fixture pages usable', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'networkidle' })

  const modelsLink = page.locator('.gp-sidebar-nav a[href="/models"]').first()
  await modelsLink.focus()
  await expect(modelsLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/models')
  await expect(page.getByTestId('production-models')).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/resources/nodes', { waitUntil: 'networkidle' })
  await expect(page.getByTestId('production-node-status')).toBeVisible()
  await expect(page.getByTestId('fixture-notice')).toBeVisible()
  const viewport = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth }))
  expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.viewportWidth)

  await page.getByTestId('sidebar-toggle').click()
  await expect(page.getByTestId('app-sidebar')).toHaveAttribute('role', 'dialog')
  await expect(page.getByTestId('sidebar-toggle')).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('sidebar-toggle')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByTestId('sidebar-toggle')).toBeFocused()
})
