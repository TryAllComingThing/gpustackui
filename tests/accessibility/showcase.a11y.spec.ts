import { expect, test } from '@playwright/test'

test('showcase exposes named controls, landmark semantics and keyboard navigation', async ({ page }) => {
  await page.goto('/showcase/index.html')

  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible()
  await expect(page.getByTestId('breadcrumb')).toHaveAttribute('aria-label', '当前位置')
  await expect(page.getByTestId('breadcrumb').locator('[aria-current="page"]')).toHaveCount(1)

  await expect(page.getByLabel('当前主题')).toBeVisible()
  await expect(page.getByLabel('表格状态')).toBeVisible()
  await expect(page.getByTestId('section-components').getByLabel('模型名称')).toBeVisible()
  await expect(page.getByTestId('section-form').getByRole('textbox', { name: '模型名称*' })).toBeVisible()
  await expect(page.getByTestId('section-form').getByRole('combobox', { name: '资源规格*' })).toBeVisible()
  await expect(page.getByTestId('section-form').getByRole('textbox', { name: 'API 地址' })).toBeVisible()

  const navigationItem = page.getByRole('button', { name: '节点状态' })
  await navigationItem.focus()
  await expect(navigationItem).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByText('当前节点：resources-nodes')).toBeVisible()

  await page.getByRole('button', { name: '打开弹窗' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: '关闭' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('all five themes preserve semantic focus and status colors', async ({ page }) => {
  await page.goto('/showcase/index.html')
  const themes = ['standard', 'business', 'future', 'sky', 'ocean']
  const focusColors = new Set<string>()

  for (const theme of themes) {
    await page.getByLabel('当前主题').selectOption(theme)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    const cssValues = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement)
      return {
        focus: root.getPropertyValue('--gp-focus-ring').trim(),
        success: root.getPropertyValue('--gp-success-default').trim(),
        warning: root.getPropertyValue('--gp-warning-default').trim(),
        danger: root.getPropertyValue('--gp-danger-default').trim(),
      }
    })
    expect(cssValues.success).not.toBe('')
    expect(cssValues.warning).not.toBe('')
    expect(cssValues.danger).not.toBe('')
    focusColors.add(cssValues.focus)
  }

  expect(focusColors.size).toBe(5)
})
