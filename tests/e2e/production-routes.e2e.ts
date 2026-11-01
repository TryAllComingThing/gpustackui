import { expect, test } from '@playwright/test'

test('production shell exposes routes, navigation and independent density', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible()
  await expect(page.getByTestId('production-dashboard')).toBeVisible()
  await page.getByRole('button', { name: '资源管理' }).click()
  await page.getByRole('link', { name: 'GPU 资源' }).click()
  await expect(page).toHaveURL(/\/resources\/gpus$/)
  await expect(page.getByTestId('production-gpu-resources')).toBeVisible()
  await expect(page.getByTestId('breadcrumb').locator('[aria-current="page"]')).toContainText('GPU 资源')
  await page.getByLabel('密度').selectOption('compact')
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--gp-control-height-md').trim())).toBe('32px')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'standard')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--gp-control-height-md').trim())).toBe('32px')
  await page.getByRole('button', { name: '折叠导航' }).click()
  await expect(page.getByRole('button', { name: '展开导航' })).toBeVisible()
})

test('production navigation reaches every registered module route', async ({ page }) => {
  await page.goto('/dashboard')
  const routes = [
    ['概览', '/dashboard', 'production-dashboard'],
    ['GPU 资源', '/resources/gpus', 'production-gpu-resources'],
    ['节点状态', '/resources/nodes', 'production-node-status'],
    ['模型服务', '/models', 'production-models'],
    ['部署任务', '/deployments', 'production-deployments'],
    ['服务实例', '/services', 'production-services'],
    ['系统设置', '/settings', 'production-settings'],
  ] as const
  for (const [label, path, testId] of routes) {
    if (label === 'GPU 资源' || label === '节点状态') {
      const resourceLink = page.getByRole('link', { name: label })
      if (!(await resourceLink.isVisible())) await page.getByRole('button', { name: '资源管理' }).click()
    }
    await page.getByRole('link', { name: label }).click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.getByTestId(testId)).toBeVisible()
  }
})
