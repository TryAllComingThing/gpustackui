import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { createPrototypeServer } from './serve.mjs'

const server = createPrototypeServer()
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
const port = typeof address === 'object' && address ? address.port : 0
const prototypeUrl = `http://127.0.0.1:${port}/planning/admin-foundation/prototypes/admin-foundation/index.html`
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'zh-CN' })
const page = await context.newPage()
const pageErrors = []
page.on('pageerror', (error) => pageErrors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') pageErrors.push(message.text())
})

async function axeCheck(label) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  if (results.violations.length > 0) {
    console.error(`[axe:${label}]`, JSON.stringify(results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => node.target),
    })), null, 2))
  }
  assert.equal(results.violations.length, 0, `axe ${label} found accessibility violations`)
}

try {
  await page.goto(prototypeUrl, { waitUntil: 'load' })
  await page.waitForSelector('#org-tree tbody tr')
  assert.match(await page.title(), /HTML 原型/)
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'standard')

  await page.selectOption('#theme-select', 'ocean')
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'ocean')
  await page.selectOption('#density-select', 'comfortable')
  assert.equal(await page.locator('html').getAttribute('data-density'), 'comfortable')
  await page.selectOption('#appearance-select', 'dark')
  assert.equal(await page.locator('html').getAttribute('data-appearance'), 'dark')
  await page.selectOption('#theme-select', 'standard')
  await page.selectOption('#density-select', 'standard')
  await page.selectOption('#appearance-select', 'light')

  const platformRowButton = page.locator('[data-row-focus="org_platform"]')
  await platformRowButton.focus()
  await platformRowButton.press('ArrowLeft')
  await page.waitForSelector('[data-org-row="org_infra"]', { state: 'detached' })
  await platformRowButton.press('ArrowRight')
  await page.waitForSelector('[data-org-row="org_infra"]')

  const createButton = page.locator('#org-create-button')
  await createButton.click()
  await page.waitForSelector('#org-drawer:not([hidden])')
  await page.keyboard.press('Escape')
  await page.waitForSelector('#org-drawer', { state: 'hidden' })
  assert.equal(await createButton.evaluate((element) => element === document.activeElement), true)

  await page.locator('[data-org-action="move"][data-org-id="org_platform"]').click()
  await page.waitForSelector('#move-dialog[open]')
  await page.locator('#move-dialog [data-close-dialog]').first().click()
  await page.waitForSelector('#move-dialog', { state: 'hidden' })

  await page.selectOption('#org-demo-state', 'conflict')
  assert.equal(await page.locator('#org-banner').isVisible(), true)
  assert.match(await page.locator('#org-banner').innerText(), /ORG_HAS_ACTIVE_CHILDREN/)
  await page.selectOption('#org-demo-state', 'normal')
  assert.equal(await page.locator('#org-banner').isVisible(), false)

  await page.locator('[data-screen-target="roles"]').first().click()
  await page.waitForSelector('#screen-roles:not([hidden])')
  const assignRole = page.locator('input[data-permission-key="iam:user:assign-role"]')
  await assignRole.check()
  assert.match(await page.locator('#permission-change-summary').innerText(), /新增 1 项/)
  assert.equal(await page.locator('#permission-save').isEnabled(), true)
  await page.screenshot({ path: '/tmp/admin-foundation-prototype-roles.png', fullPage: true })

  await page.locator('[data-screen-target="announcements"]').first().click()
  await page.waitForSelector('#screen-announcements:not([hidden])')
  await page.locator('#announcement-withdraw').click()
  await page.waitForSelector('#generic-dialog[open]')
  await page.locator('#generic-dialog-confirm').click()
  await page.waitForSelector('#generic-dialog', { state: 'hidden' })
  assert.equal(await page.locator('#announcement-status-badge').innerText(), 'withdrawn')
  assert.equal(await page.locator('#announcement-withdraw').isDisabled(), true)
  await page.screenshot({ path: '/tmp/admin-foundation-prototype-announcements.png', fullPage: true })

  await page.locator('[data-screen-target="audit"]').first().click()
  await page.waitForSelector('#screen-audit:not([hidden])')
  assert.match(await page.locator('#screen-audit').innerText(), /不提供编辑、删除、导出、归档或合规删除入口/)
  await page.screenshot({ path: '/tmp/admin-foundation-prototype-audit.png', fullPage: true })

  await page.locator('[data-screen-target="organization"]').first().click()
  await page.screenshot({ path: '/tmp/admin-foundation-prototype-desktop.png', fullPage: true })
  await axeCheck('desktop')

  await page.setViewportSize({ width: 320, height: 800 })
  await page.waitForTimeout(100)
  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  assert.ok(overflow.scrollWidth <= overflow.viewport + 1, `page-level horizontal overflow: ${JSON.stringify(overflow)}`)
  await page.screenshot({ path: '/tmp/admin-foundation-prototype-320.png', fullPage: true })
  await axeCheck('320px')

  assert.deepEqual(pageErrors, [], `browser errors: ${pageErrors.join('\n')}`)
  console.log(JSON.stringify({
    ok: true,
    prototypeUrl,
    checks: [
      'theme/density/appearance runtime',
      'tree keyboard expand/collapse',
      'drawer Escape and focus restore',
      'move dialog keyboard close',
      '409 state banner',
      'permission matrix change summary',
      'announcement withdraw confirmation',
      'audit read-only boundary',
      '320px horizontal overflow',
      'axe WCAG 2 A/AA desktop and 320px',
    ],
    screenshots: [
      '/tmp/admin-foundation-prototype-desktop.png',
      '/tmp/admin-foundation-prototype-roles.png',
      '/tmp/admin-foundation-prototype-announcements.png',
      '/tmp/admin-foundation-prototype-audit.png',
      '/tmp/admin-foundation-prototype-320.png',
    ],
  }, null, 2))
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}
