import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('showcase has no critical or serious axe violations', async ({ page }) => {
  await page.goto('/showcase/index.html', { waitUntil: 'networkidle' })
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const blocking = results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
})

test('keyboard users can open and dismiss a dialog with Escape', async ({ page }) => {
  await page.goto('/showcase/index.html', { waitUntil: 'networkidle' })
  const opener = page.getByTestId('state-dialog-open')
  await opener.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(opener).toBeFocused()
})
