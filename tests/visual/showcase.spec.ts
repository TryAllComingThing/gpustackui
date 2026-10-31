import { test, expect } from '@playwright/test'
test('three themes persist and render components', async ({ page }) => {
 await page.goto('http://localhost:4174/showcase/index.html')
 await expect(page.getByRole('heading', { name: 'Theme & Component Showcase' })).toBeVisible()
 const tokenColors = new Map<string, string[]>()
 for (const theme of ['standard','business','future']) {
   await page.getByLabel('当前主题').selectOption(theme)
   await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
   const colors = await page.locator('.swatch-color').evaluateAll((swatches) => swatches.map((swatch) => getComputedStyle(swatch).backgroundColor))
   tokenColors.set(theme, colors)
   await page.reload()
   await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
   await expect(page.getByRole('button', { name: /主按钮/ })).toBeVisible()
 }
 await page.getByRole('button', { name: /主按钮/ }).click()
 await expect(page.getByRole('button', { name: /主按钮 · 1/ })).toBeVisible()
 await page.getByRole('button', { name: '打开弹窗' }).click()
 await expect(page.getByText('这是 Nuxt UI 弹窗兼容性验证。')).toBeVisible()
 for (const index of [0, 1, 2, 3]) {
   expect(new Set([...tokenColors.values()].map((colors) => colors[index])).size).toBe(3)
 }
})
