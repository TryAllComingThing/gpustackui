import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('strict Chromium gate covers axe, reduced motion, and keyboard focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/showcase/index.html', { waitUntil: 'networkidle' })

  const motion = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--gp-motion-standard').trim())
  expect(['0ms', '0s']).toContain(motion)

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const blocking = results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])

  const dialogButton = page.getByTestId('state-dialog-open')
  await dialogButton.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(dialogButton).toBeFocused()
})
