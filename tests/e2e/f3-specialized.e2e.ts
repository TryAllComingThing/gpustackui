import { expect, test } from '@playwright/test'

test.use({ locale: 'zh-CN', timezoneId: 'UTC', colorScheme: 'light', deviceScaleFactor: 1 })

test('F3 typography, density persistence, layout geometry and responsive shell', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/dashboard')

  const typography = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    const title = document.querySelector('.gp-page-title')
    const numeric = document.querySelector('.gp-kpi')
    return {
      bodySize: root.getPropertyValue('--gp-type-body-size').trim(),
      bodyLineHeight: root.getPropertyValue('--gp-type-body-line-height').trim(),
      titleSize: title ? getComputedStyle(title).fontSize : '',
      titleLineHeight: title ? getComputedStyle(title).lineHeight : '',
      bodyFont: getComputedStyle(document.body).fontSize,
      numericVariant: numeric ? getComputedStyle(numeric).fontVariantNumeric : '',
      codeFamily: root.getPropertyValue('--gp-type-code-family').trim(),
    }
  })
  expect(typography.bodySize).toBe('14px')
  expect(typography.bodyLineHeight).toBe('22px')
  expect(typography.titleSize).toBe('24px')
  expect(typography.titleLineHeight).toBe('32px')
  expect(typography.bodyFont).toBe('14px')
  expect(typography.numericVariant).toContain('tabular-nums')
  expect(typography.codeFamily).toContain('ui-monospace')

  await page.getByLabel('主题').selectOption('ocean')
  await page.getByLabel('密度').selectOption('comfortable')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean')
  await expect(page.locator('html')).toHaveAttribute('data-density', 'comfortable')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean')
  await expect(page.locator('html')).toHaveAttribute('data-density', 'comfortable')

  const geometry = await page.evaluate(() => ({
    header: getComputedStyle(document.querySelector('.gp-app-header')!).height,
    sidebar: getComputedStyle(document.querySelector('.gp-app-sidebar')!).width,
    breadcrumb: Boolean(document.querySelector('.gp-app-header .gp-header-breadcrumb')),
    pageBackground: getComputedStyle(document.body).backgroundColor,
      headerZIndex: getComputedStyle(document.querySelector('.gp-app-header')!).zIndex,
  }))
  expect(geometry.header).toBe('60px')
  expect(geometry.sidebar).toBe('200px')
  expect(geometry.breadcrumb).toBe(true)
  expect(geometry.pageBackground).not.toBe('')
  expect(geometry.headerZIndex).toMatch(/^\d+$/)

  await page.screenshot({ path: testInfo.outputPath('f3-desktop-layout.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 900 })
  await page.reload()
  await expect(page.locator('.gp-app-header')).toHaveCSS('height', '60px')
  await expect(page.getByTestId('breadcrumb')).toBeVisible()
  await expect(page.locator('.gp-app-sidebar')).toHaveCSS('position', 'fixed')
  await expect(page.locator('.gp-app-main')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('f3-mobile-layout.png'), fullPage: true })
})
