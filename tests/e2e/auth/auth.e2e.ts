import { expect, test, type Page } from '@playwright/test'
import { adminUser, mockAuthenticatedSession } from '../support/auth'

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{ name: 'XSRF-TOKEN', value: 'test-csrf-token', url: 'http://127.0.0.1:4183' }])
})

async function installAuthApi(
  page: Page,
  initialAuthenticated: boolean,
  options: { logoutStatus?: number; logoutBody?: string; logoutContentType?: string } = {},
) {
  let authenticated = initialAuthenticated
  let meCalls = 0

  await page.route('**/users/me', async (route) => {
    meCalls += 1
    if (authenticated) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminUser) })
    } else {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) })
    }
  })
  await page.route('**/auth/login', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    authenticated = true
    await route.fulfill({ status: 200, contentType: 'text/plain', body: '' })
  })
  await page.route('**/auth/logout', async (route) => {
    const status = options.logoutStatus ?? 200
    if (status >= 200 && status < 300) authenticated = false
    await route.fulfill({ status, contentType: options.logoutContentType ?? 'text/plain', body: options.logoutBody ?? '' })
  })

  return { get meCalls() { return meCalls } }
}

test('anonymous protected navigation redirects to login and returns to the original target', async ({ page }) => {
  await installAuthApi(page, false)
  await page.goto('/resources/gpus?tab=usage')
  await expect(page.getByTestId('login-page')).toBeVisible()
  await expect(page).toHaveURL(/\/login\?redirect=/)
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/resources/gpus?tab=usage')

  await page.locator('input[name="username"]').fill('admin')
  await page.locator('input[name="password"]').fill('secret')
  await page.getByRole('button', { name: '登录', exact: true }).click()

  await expect(page).toHaveURL('/resources/gpus?tab=usage', { timeout: 15_000 })
  await expect(page.locator('.gp-app-shell')).toBeVisible()
  await expect(page.getByTestId('auth-user')).toContainText('admin')
})

test('forged localStorage identity cannot authorize a protected route', async ({ page }) => {
  await page.addInitScript((user) => localStorage.setItem('gpustack-auth-user', JSON.stringify(user)), adminUser)
  await installAuthApi(page, false)
  await page.goto('/dashboard')

  await expect(page.getByTestId('login-page')).toBeVisible()
  await expect(page).toHaveURL(/\/login\?redirect=/)
  expect(await page.evaluate(() => localStorage.getItem('gpustack-auth-user'))).toBeNull()
})

test('refreshing a protected page performs a new server session confirmation', async ({ page }) => {
  const state = await installAuthApi(page, true)
  await page.goto('/dashboard')
  await expect(page.locator('.gp-app-shell')).toBeVisible()
  expect(state.meCalls).toBe(1)

  await page.reload()
  await expect(page.locator('.gp-app-shell')).toBeVisible()
  expect(state.meCalls).toBe(2)
})

test('a 401 from logout clears the session and returns to login once', async ({ page }) => {
  await installAuthApi(page, true, { logoutStatus: 401, logoutContentType: 'application/json', logoutBody: JSON.stringify({ message: 'Expired' }) })
  await page.goto('/dashboard')
  await expect(page.locator('.gp-app-shell')).toBeVisible()

  await page.getByTestId('auth-logout').click()

  await expect(page.getByTestId('login-page')).toBeVisible()
  await expect(page).toHaveURL(/\/login(?:\?|$)/)
})

test('a session probe 401 on refresh returns to login without another confirmation loop', async ({ page }) => {
  await installAuthApi(page, true)
  await page.goto('/dashboard')
  await expect(page.locator('.gp-app-shell')).toBeVisible()
  let probe401Calls = 0

  await page.unroute('**/users/me')
  await page.route('**/users/me', async (route) => {
    probe401Calls += 1
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Expired' }) })
  })
  await page.reload()

  await expect(page.getByTestId('login-page')).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/login')
  expect(probe401Calls).toBe(1)
})

test('403 from logout shows forbidden state without treating the user as anonymous', async ({ page }) => {
  await installAuthApi(page, true, { logoutStatus: 403, logoutContentType: 'application/json', logoutBody: JSON.stringify({ message: 'Forbidden' }) })
  await page.goto('/dashboard')

  await page.getByTestId('auth-logout').click()

  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByTestId('logout-error')).toContainText('退出未能确认')
  await expect(page.getByTestId('auth-user')).toContainText('admin')
  await expect(page.getByTestId('login-page')).toHaveCount(0)
})

test('logout clears the server session and returns to login', async ({ page }) => {
  await installAuthApi(page, true)
  await page.goto('/dashboard')
  await expect(page.getByTestId('auth-user')).toContainText('admin')

  await page.getByTestId('auth-logout').click()
  await expect(page.getByTestId('login-page')).toBeVisible()
  await expect(page).toHaveURL('/login')
})

test('successful SSO logout navigates to the configured trusted logout URL', async ({ page }) => {
  await installAuthApi(page, true, {
    logoutBody: JSON.stringify({ logout_url: 'https://idp.example.com/logout?client=gpustack' }),
    logoutContentType: 'application/json',
  })
  await page.route('https://idp.example.com/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Signed out</title>' })
  })
  await page.goto('/dashboard')
  await expect(page.getByTestId('auth-user')).toContainText('admin')

  await page.getByTestId('auth-logout').click()

  await expect(page).toHaveURL(/https:\/\/idp\.example\.com\/logout\?client=gpustack/)
})

test('unavailable page retries session confirmation and returns to the original route', async ({ page }) => {
  let online = false
  await page.route('**/users/me', async (route) => {
    if (!online) {
      await route.abort('failed')
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminUser) })
  })

  await page.goto('/dashboard')
  await expect(page.getByTestId('production-unavailable')).toBeVisible()
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/dashboard')

  online = true
  await page.getByTestId('session-retry').click()
  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByTestId('production-dashboard')).toBeVisible()
})

test('invalid credentials keep the user on login and show an accessible error', async ({ page }) => {
  await page.route('**/users/me', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) })
  })
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid credentials' }) })
  })

  await page.goto('/login')
  await page.locator('input[name="username"]').fill('admin')
  await page.locator('input[name="password"]').fill('wrong')
  await page.getByRole('button', { name: '登录', exact: true }).click()

  await expect(page.getByRole('alert')).toContainText('用户名或密码错误')
  await expect(page).toHaveURL('/login')
})

test('shows the configured SSO entry only when the backend reports SAML or OIDC', async ({ page }) => {
  await page.route('**/users/me', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) })
  })
  await page.route('**/auth/config', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ is_saml: true, is_oidc: false }) })
  })

  await page.goto('/login')

  await expect(page.getByTestId('sso-login')).toBeVisible()
  await expect(page.getByTestId('sso-login-link')).toHaveAttribute('href', '/auth/saml/login')
})

test('updates the password and returns to login after confirmed server logout', async ({ page }) => {
  await mockAuthenticatedSession(page)
  let updatedPassword: unknown = null
  let loggedOut = false
  await page.route('**/auth/update-password', async (route) => {
    updatedPassword = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'text/plain', body: '' })
  })
  await page.route('**/auth/logout', async (route) => {
    loggedOut = true
    await route.fulfill({ status: 200, contentType: 'text/plain', body: '' })
  })

  await page.goto('/account/password')
  await page.locator('input[name="current-password"]').fill('old-secret')
  await page.locator('input[name="new-password"]').fill('new-secret')
  await page.locator('input[name="confirm-password"]').fill('new-secret')
  await page.getByRole('button', { name: '更新密码', exact: true }).click()

  await expect(page.getByTestId('login-page')).toBeVisible()
  await expect(page).toHaveURL('/login')
  expect(updatedPassword).toEqual({ current_password: 'old-secret', new_password: 'new-secret' })
  expect(loggedOut).toBe(true)
})

test('keeps the updated-password result visible when server logout is not confirmed', async ({ page }) => {
  await mockAuthenticatedSession(page)
  await page.route('**/auth/update-password', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/plain', body: '' })
  })
  await page.route('**/auth/logout', async (route) => {
    await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Logout denied' }) })
  })

  await page.goto('/account/password')
  await page.locator('input[name="current-password"]').fill('old-secret')
  await page.locator('input[name="new-password"]').fill('new-secret')
  await page.locator('input[name="confirm-password"]').fill('new-secret')
  await page.getByRole('button', { name: '更新密码', exact: true }).click()

  await expect(page.getByTestId('password-success')).toBeVisible()
  await expect(page.getByTestId('password-logout-warning')).toContainText('服务端退出未能确认')
  await expect(page.getByTestId('production-password-change')).toBeVisible()
  await expect(page.getByTestId('login-page')).toHaveCount(0)
})
