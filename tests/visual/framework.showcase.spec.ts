import { expect, test } from '@playwright/test'

const THEME_HOVER_RGB: Record<string, string> = {
  standard: 'rgb(12, 94, 235)',
  business: 'rgb(20, 81, 174)',
  future: 'rgb(47, 89, 238)',
  sky: 'rgb(18, 101, 209)',
  ocean: 'rgb(22, 100, 164)',
}

test('showcase uses shared U adapters, local fixtures, and theme-aware states', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/showcase/index.html', { waitUntil: 'networkidle' })

  await expect(page.getByTestId('matrix-table')).toContainText('UDataTable')
  await expect(page.getByTestId('matrix-navigation')).toContainText('USidebarNav')
  await expect(page.getByTestId('matrix-navigation')).toContainText('UBreadcrumb')
  await expect(page.getByTestId('matrix-textarea')).toContainText('.gp-app-textarea')
  await expect(page.getByTestId('matrix-datepicker')).toContainText('UInputDate')
  await expect(page.getByTestId('matrix-datepicker')).toContainText('已实现')
  await expect(page.getByTestId('matrix-radio')).toContainText('URadioGroup')
  await expect(page.getByTestId('matrix-radio')).toContainText('已实现')
  await expect(page.getByTestId('matrix-switch')).toContainText('已实现')
  await expect(page.getByTestId('matrix-popover')).toContainText('已实现')
  await expect(page.getByTestId('matrix-upload')).toContainText('已实现')
  await expect(page.getByTestId('matrix-tree')).toContainText('已实现')
  await expect(page.getByTestId('matrix-chart')).toContainText('UChart')
  await expect(page.getByTestId('matrix-chart')).toContainText('已实现')
  await expect(page.locator('.gp-sidebar-nav')).toHaveCount(1)
  await expect(page.locator('[data-testid="breadcrumb"]')).toHaveCount(1)
  await expect(page.getByTestId('advanced-radio')).toBeVisible()
  await expect(page.getByTestId('advanced-switch').first()).toBeVisible()
  await expect(page.getByTestId('advanced-popover-trigger')).toBeVisible()
  await expect(page.getByTestId('advanced-upload')).toBeVisible()
  await expect(page.getByTestId('advanced-tree')).toBeVisible()
  await expect(page.getByTestId('advanced-chart')).toBeVisible()
  await expect(page.getByTestId('section-component-states')).not.toContainText('默认状态使用统一')

  const overviewNav = page.locator('.gp-sidebar-nav [data-slot="link"]').filter({ hasText: '概览' })
  await overviewNav.click()
  await page.mouse.move(1100, 80)
  await expect(overviewNav).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  expect(await overviewNav.evaluate((element) => getComputedStyle(element, '::before').backgroundColor)).toBe('rgba(0, 0, 0, 0)')

  const table = page.getByTestId('section-table')
  await expect(table.locator('.gp-data-table')).toHaveCount(1)
  await table.getByRole('checkbox').nth(1).check()
  await expect(page.locator('.gp-selection-summary')).toContainText('已选择 1 项资源')

  const patternTable = page.getByTestId('pattern-table')
  const viewButton = patternTable.getByRole('button', { name: '查看 saas-001' })
  await expect(viewButton.locator('svg')).toHaveCount(1)
  await viewButton.click()
  const detailDialog = page.getByRole('dialog', { name: '资源详情' })
  await expect(detailDialog).toBeVisible()
  await expect(detailDialog).toContainText('控制台')
  await page.keyboard.press('Escape')
  await expect(detailDialog).toBeHidden()

  for (const [theme, hover] of Object.entries(THEME_HOVER_RGB)) {
    await page.selectOption('[data-testid="theme-select"]', theme)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    const primaryButton = page.getByTestId('state-dialog-open')
    await primaryButton.hover()
    await page.waitForTimeout(200)
    await expect(primaryButton).toHaveCSS('background-color', hover)
  }

  for (const density of ['compact', 'standard', 'comfortable']) {
    await page.selectOption('[data-testid="density-select"]', density)
    await expect(page.locator('html')).toHaveAttribute('data-density', density)
  }

  await page.getByTestId('state-dialog-open').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  await page.getByTestId('state-drawer-open').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  await page.getByTestId('state-toast-open').click()
  const toast = page.getByRole('region', { name: 'Notifications (F8)' }).getByRole('listitem').filter({ hasText: '操作成功' }).last()
  await expect(toast).toBeVisible()
  await page.waitForTimeout(300)
  const toastBox = await toast.boundingBox()
  const viewport = page.viewportSize()
  expect(toastBox).not.toBeNull()
  expect(toastBox!.height).toBeGreaterThan(60)
  expect(toastBox!.y + toastBox!.height).toBeLessThanOrEqual(viewport!.height)
  expect(errors).toEqual([])
})
