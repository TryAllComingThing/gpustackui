import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('F4 components and patterns pass keyboard, state, theme and density checks', async ({ page }) => {
  await page.goto('/showcase/index.html')
  await expect(page.getByTestId('section-f4-states')).toBeVisible()
  await expect(page.getByTestId('section-patterns')).toBeVisible()
  await expect(page.getByTestId('section-user-management')).toBeVisible()

  for (const theme of ['standard', 'business', 'future', 'sky', 'ocean']) {
    await page.getByLabel('当前主题').selectOption(theme)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    const tokenValues = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement)
      return [
        style.getPropertyValue('--gp-brand-g600').trim(),
        style.getPropertyValue('--gp-success-default').trim(),
        style.getPropertyValue('--gp-warning-default').trim(),
        style.getPropertyValue('--gp-danger-default').trim(),
      ]
    })
    expect(tokenValues.every(Boolean)).toBe(true)
  }

  const patternForm = page.getByTestId('pattern-form')
  await patternForm.getByRole('button', { name: '异步提交' }).click()
  await expect(patternForm.getByRole('alert')).toContainText('请输入项目名称')
  await patternForm.getByRole('textbox', { name: '项目名称*' }).focus()
  await expect(patternForm.getByRole('textbox', { name: '项目名称*' })).toBeFocused()

  await page.getByTestId('state-dialog-open').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  await page.getByTestId('state-drawer-open').click()
  await expect(page.getByText('这是 F4 Drawer 状态验证。')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('这是 F4 Drawer 状态验证。')).toBeHidden()

  await page.getByLabel('当前主题').selectOption('future')
  const densityValues = ['compact', 'standard', 'comfortable'] as const
  for (const density of densityValues) {
    await page.evaluate((value) => document.documentElement.dataset.density = value, density)
    await expect(page.locator('html')).toHaveAttribute('data-density', density)
  }
})

test('F4 Showcase has no axe-core violations', async ({ page }) => {
  await page.goto('/showcase/index.html')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('user management acceptance covers themes and densities', async ({ page }) => {
  await page.goto('/showcase/index.html')
  for (const theme of ['standard', 'business', 'future', 'sky', 'ocean']) {
    await page.getByTestId('theme-select').selectOption(theme)
    for (const density of ['compact', 'standard', 'comfortable']) {
      await page.getByTestId('density-select').selectOption(density)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expect(page.locator('html')).toHaveAttribute('data-density', density)
      await expect(page.getByTestId('section-user-management')).toBeVisible()
    }
  }
})

test('F4 visual baseline renders the shared component and pattern sections', async ({ page }) => {
  await page.goto('/showcase/index.html')
  await expect(page.getByTestId('section-f4-states')).toBeVisible()
  await expect(page.getByTestId('section-patterns')).toBeVisible()
  const visualOptions = { animations: 'disabled' as const, maxDiffPixels: 250 }
  await expect(page.getByTestId('section-f4-states')).toHaveScreenshot('f4-states.png', visualOptions)
  await expect(page.getByTestId('section-patterns')).toHaveScreenshot('f4-patterns.png', visualOptions)
})
