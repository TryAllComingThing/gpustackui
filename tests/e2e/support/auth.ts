import type { Page } from '@playwright/test'

export const adminUser = {
  id: 1,
  username: 'admin',
  is_admin: true,
  is_active: true,
  require_password_change: false,
  full_name: 'Administrator',
  source: 'Local',
}

export async function mockAuthenticatedSession(page: Page, user = adminUser) {
  await page.route('**/v2/users/me', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
  })
}

export async function mockAnonymousSession(page: Page) {
  await page.route('**/v2/users/me', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) })
  })
}
