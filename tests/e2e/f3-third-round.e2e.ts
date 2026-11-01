import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN', timezoneId: 'UTC', colorScheme: 'light', deviceScaleFactor: 1 })

const themes = ['standard', 'business', 'future', 'sky', 'ocean'] as const
const densities = [
  ['compact', '32px', '36px', '12px'],
  ['standard', '36px', '44px', '20px'],
  ['comfortable', '40px', '52px', '24px'],
] as const

test('F3 five themes x three densities preserve orthogonal runtime tokens and layout', async ({ page }, testInfo) => {
  await page.goto('/dashboard')
  const screenshots: string[] = []
  for (const theme of themes) {
    for (const [density, controlHeight, rowHeight, cardPadding] of densities) {
      await page.getByLabel('主题').selectOption(theme)
      await page.getByLabel('密度').selectOption(density)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expect(page.locator('html')).toHaveAttribute('data-density', density)
      const values = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement)
        return {
          controlHeight: style.getPropertyValue('--gp-control-height-md').trim(),
          rowHeight: style.getPropertyValue('--gp-table-row-height-md').trim(),
          cardPadding: style.getPropertyValue('--gp-card-padding-md').trim(),
          surface: style.getPropertyValue('--gp-surface-default').trim(),
          font: style.getPropertyValue('--gp-type-body-size').trim(),
        }
      })
      expect(values.controlHeight).toBe(controlHeight)
      expect(values.rowHeight).toBe(rowHeight)
      expect(values.cardPadding).toBe(cardPadding)
      expect(values.surface).not.toBe('')
      expect(values.font).toBe('14px')
      expect(await page.locator('.gp-app-header').evaluate((element) => getComputedStyle(element).height)).toBe('60px')
      expect(await page.locator('.gp-app-sidebar').evaluate((element) => getComputedStyle(element).width)).toBe('200px')
      await expect(page.getByTestId('breadcrumb')).toBeVisible()
      const screenshotPath = testInfo.outputPath('screenshots', `${theme}-${density}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: true })
      screenshots.push(screenshotPath)
    }
  }
  await page.getByLabel('主题').selectOption('future')
  await page.getByLabel('密度').selectOption('comfortable')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'future')
  await expect(page.locator('html')).toHaveAttribute('data-density', 'comfortable')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--gp-control-height-md').trim())).toBe('40px')
  console.log(`F3 screenshots: ${screenshots.join(',')}`)
})
