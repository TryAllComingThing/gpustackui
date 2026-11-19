import { expect, test } from '@playwright/test'
import { mockAuthenticatedSession } from '../support/auth'
import { mockAdminApi } from '../support/admin-api'

test.beforeEach(async ({ page }) => {
  await mockAuthenticatedSession(page)
  await mockAdminApi(page)
})

test('user management edits profile, saves authorization, and invites a user through the API', async ({ page }) => {
  await page.goto('/system/users', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '查看 user_zhang' }).click()

  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  await drawer.getByLabel('显示名').fill('李明（平台产品）')
  await drawer.getByTestId('user-profile-save').click()
  await expect(page.getByTestId('user-detail-feedback')).toContainText('已更新用户资料：李明（平台产品）')
  await expect(drawer.getByTestId('user-permission-preview')).toContainText('iam:user:update')
  await drawer.getByRole('button', { name: '移除角色 机构管理员' }).click()
  await expect(drawer.getByTestId('user-permission-preview')).toContainText('iam:user:update')
  await drawer.getByTestId('user-authorization-save').click()
  await expect(drawer.getByTestId('user-detail-feedback')).toContainText('已更新用户授权：李明（平台产品）')
  await expect(drawer.getByTestId('user-permission-preview')).not.toContainText('iam:user:update')

  await page.goto('/system/users', { waitUntil: 'networkidle' })
  await page.getByTestId('user-invite-open').click()
  const inviteDialog = page.getByRole('dialog', { name: '邀请用户' })
  await inviteDialog.getByLabel('用户名').fill('new.viewer')
  await inviteDialog.getByLabel('显示名').fill('新访客')
  await inviteDialog.getByLabel('邮箱').fill('new.viewer@example.com')
  await inviteDialog.getByRole('button', { name: '发送邀请' }).click()
  await expect(page.getByTestId('users-feedback')).toContainText('已邀请用户：新访客')
})

test('role management edits custom permissions while protecting built-in roles', async ({ page }) => {
  await page.goto('/system/roles', { waitUntil: 'networkidle' })
  await page.getByTestId('role-item-role_tenant_admin').click()
  await expect(page.getByTestId('role-protected-notice')).toBeVisible()
  await expect(page.getByTestId('role-save')).toBeDisabled()

  await page.getByTestId('role-item-role_content_editor').click()
  await expect(page.getByTestId('role-protected-notice')).toHaveCount(0)
  await page.locator('.role-detail').getByLabel('说明').fill('维护公告草稿并提交发布（更新）')
  await expect(page.getByTestId('role-save')).toBeEnabled()
  await page.getByTestId('permission-content:announcement:withdraw').click()
  await expect(page.getByTestId('role-save')).toBeEnabled()
  await page.getByTestId('role-save').click()
  await expect(page.getByTestId('role-feedback')).toContainText('已保存角色：内容编辑')
})

test('role switching confirms before discarding unsaved metadata', async ({ page }) => {
  await page.goto('/system/roles', { waitUntil: 'networkidle' })
  await page.getByTestId('role-item-role_content_editor').click()
  await page.locator('.role-detail').getByLabel('名称').fill('内容编辑（未保存）')
  await page.getByTestId('role-item-role_readonly').click()

  const discardDialog = page.getByRole('dialog', { name: '放弃当前角色修改？' })
  await expect(discardDialog).toBeVisible()
  await discardDialog.getByRole('button', { name: '继续编辑' }).click()
  await expect(page.locator('.role-detail').getByLabel('名称')).toHaveValue('内容编辑（未保存）')

  await page.getByTestId('role-item-role_readonly').click()
  await page.getByTestId('role-discard-confirm').click()
  await expect(page.locator('.role-detail')).toContainText('只读管理员')
})

test('last tenant administrator cannot remove the protected tenant role binding', async ({ page }) => {
  await page.goto('/system/users', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '查看 user_admin' }).click()
  const drawer = page.getByRole('dialog')
  await drawer.getByRole('button', { name: '移除角色 租户管理员' }).click()
  await drawer.getByTestId('user-authorization-save').click()
  await expect(drawer.getByTestId('user-detail-error')).toContainText('最后一个租户管理员')
})

test('dictionary management guards active types and edits entries', async ({ page }) => {
  await page.goto('/system/dictionaries', { waitUntil: 'networkidle' })
  await page.getByTestId('dictionary-type-status').click()
  await expect(page.getByTestId('dictionary-error')).toContainText('该类型仍包含启用中的字典项')

  await page.getByRole('button', { name: '编辑 排队中' }).click()
  const entryDialog = page.getByRole('dialog', { name: '编辑字典项' })
  await entryDialog.getByLabel('字典项名称').fill('等待调度')
  await entryDialog.getByRole('button', { name: '保存字典项' }).click()
  await expect(page.getByTestId('dictionary-feedback')).toContainText('已更新字典项：等待调度')
})

test('announcement management previews and publishes a draft without in-place publishing edits', async ({ page }) => {
  await page.goto('/content/announcements', { waitUntil: 'networkidle' })
  const audienceSummary = page.getByTestId('announcement-audience-summary')
  await expect(audienceSummary).toContainText('平台研发部')
  await page.getByTestId('announcement-audience-all').click()
  await expect(audienceSummary).toHaveText('全体用户')
  await page.getByTestId('announcement-audience-all').click()
  await expect(audienceSummary).toContainText('平台研发部')

  await page.getByLabel('公告标题').fill('十一月平台维护通知（更新）')
  await page.getByTestId('announcement-save').click()
  await expect(page.getByTestId('announcement-feedback')).toContainText('已保存公告草稿')

  await page.getByTestId('announcement-preview').click()
  const previewDialog = page.getByRole('dialog', { name: '公告预览快照' })
  await expect(previewDialog).toContainText('十一月平台维护通知（更新）')
  await page.keyboard.press('Escape')

  await page.getByTestId('announcement-publish').click()
  const confirmDialog = page.getByRole('dialog', { name: '确认立即发布？' })
  await confirmDialog.getByTestId('announcement-confirm').click()
  await expect(page.getByTestId('announcement-feedback')).toContainText('已发布公告：十一月平台维护通知（更新）')
  await expect(page.getByTestId('announcement-title')).toBeDisabled()
  await expect(page.getByTestId('announcement-duplicate')).toBeVisible()
})

test('announcement switching confirms unsaved drafts and publishing validates required content', async ({ page }) => {
  await page.goto('/content/announcements', { waitUntil: 'networkidle' })
  await page.getByLabel('公告标题').fill('尚未保存的维护通知')
  await page.getByTestId('announcement-item-ann_security_drill').click()

  const discardDialog = page.getByRole('dialog', { name: '放弃当前公告草稿修改？' })
  await expect(discardDialog).toBeVisible()
  await discardDialog.getByRole('button', { name: '继续编辑' }).click()
  await expect(page.getByLabel('公告标题')).toHaveValue('尚未保存的维护通知')

  await page.getByTestId('announcement-create').click()
  await page.getByTestId('announcement-discard-confirm').click()
  await page.getByTestId('announcement-publish').click()
  await expect(page.getByTestId('announcement-error')).toContainText('发布前请填写公告正文')

  await page.getByTestId('announcement-body').fill('有效正文')
  await page.getByTestId('announcement-publish').click()
  await expect(page.getByTestId('announcement-error')).toContainText('发布前请选择至少一个受众规则')
})

test('audit logs open deep-linked read-only details and show masked changes', async ({ page }) => {
  await page.goto('/audit/logs', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '查看详情 evt_20261115_001' }).click()
  await expect(page).toHaveURL('/audit/logs/evt_20261115_001')
  await expect(page.getByTestId('production-audit-detail')).toContainText('基础设施组')
  await expect(page.getByTestId('audit-request-id')).toHaveText('req_7f5c91a2')
  await expect(page.getByText('audit.permission_version_incremented')).toBeVisible()

  await page.goto('/audit/logs/evt_20261115_007', { waitUntil: 'networkidle' })
  await expect(page.getByTestId('production-audit-detail')).toContainText('已脱敏')
  await expect(page.getByRole('button', { name: '导出' })).toHaveCount(0)
})

test('organization management loads and persists tree changes through the API', async ({ page }) => {
  const requests: Array<{ method: string; path: string; ifMatch?: string; idempotencyKey?: string }> = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!url.pathname.startsWith('/api/organizations')) return
    const headers = request.headers()
    requests.push({
      method: request.method(),
      path: url.pathname,
      ifMatch: headers['if-match'],
      idempotencyKey: headers['idempotency-key'],
    })
  })

  await page.goto('/system/organizations', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: '机构管理' })).toBeVisible()
  await expect(page.getByTestId('organization-data-source')).toContainText('后端 API')
  await expect(page.getByTestId('fixture-notice')).toHaveCount(0)
  await expect(page.getByTestId('organization-loading')).toHaveCount(0)

  await page.getByTestId('organization-search').fill('前端')
  await expect(page.getByTestId('organization-node-org_platform_frontend')).toBeVisible()
  await page.getByTestId('organization-search').fill('')

  await page.getByTestId('organization-node-org_platform_frontend').click()
  await page.getByTestId('organization-edit-open').click()
  const editDialog = page.getByRole('dialog', { name: '编辑机构资料' })
  await editDialog.getByLabel('机构名称').fill('前端平台组')
  await editDialog.getByRole('button', { name: '保存资料' }).click()
  await expect(page.getByTestId('organization-feedback')).toContainText('已更新机构：前端平台组')

  await page.getByTestId('organization-move-open').click()
  const moveDialog = page.getByRole('dialog', { name: '移动机构' })
  await moveDialog.getByRole('button', { name: '确认移动' }).click()
  await expect(page.getByTestId('organization-feedback')).toContainText('已移动机构：前端平台组')
  await expect(page.getByTestId('organization-path')).toHaveText('集团总部 / 前端平台组')

  await page.getByTestId('organization-node-org_platform_frontend').click()
  await page.getByTestId('organization-status-open').click()
  await page.getByTestId('organization-status-confirm').click()
  await expect(page.getByTestId('organization-feedback')).toContainText('已停用机构：前端平台组')

  await page.getByTestId('organization-node-org_platform_infra').click()
  await page.getByTestId('organization-create-child').click()
  const createDialog = page.getByRole('dialog', { name: '新增机构' })
  await createDialog.getByLabel('机构编码').fill('FE-OPS')
  await createDialog.getByLabel('机构名称').fill('前端运维组')
  await createDialog.getByRole('button', { name: '创建机构' }).click()
  await expect(page.getByTestId('organization-feedback')).toContainText('已创建机构：前端运维组')

  expect(requests.some((entry) => entry.method === 'GET' && entry.path === '/api/organizations/tree')).toBe(true)
  expect(requests).toEqual(expect.arrayContaining([
    expect.objectContaining({ method: 'PATCH', path: '/api/organizations/org_platform_frontend', ifMatch: '"3"' }),
    expect.objectContaining({ method: 'POST', path: '/api/organizations/org_platform_frontend/move' }),
    expect.objectContaining({ method: 'POST', path: '/api/organizations/org_platform_frontend/status' }),
    expect.objectContaining({ method: 'POST', path: '/api/organizations' }),
  ]))
  for (const entry of requests.filter((candidate) => candidate.method !== 'GET')) {
    if (entry.method === 'POST') expect(entry.idempotencyKey, `${entry.method} ${entry.path}`).toBeTruthy()
    if (entry.method === 'PATCH' || entry.path.endsWith('/move') || entry.path.endsWith('/status')) {
      expect(entry.ifMatch, `${entry.method} ${entry.path}`).toMatch(/^"\d+"$/)
    }
  }

  await page.setViewportSize({ width: 320, height: 800 })
  const viewport = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth }))
  expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.viewportWidth)
})

test('admin management slices keep a 320px viewport free of page-level horizontal scrolling', async ({ page }) => {
  const adminPaths: string[] = []
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname
    if (/^\/api\/(?:users|roles|dictionaries|announcements|audit)(?:\/|$)/.test(path)) adminPaths.push(path)
  })
  await page.setViewportSize({ width: 320, height: 800 })
  for (const route of ['/system/users', '/system/roles', '/system/dictionaries', '/content/announcements', '/audit/logs']) {
    await page.goto(route, { waitUntil: 'networkidle' })
    const viewport = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth }))
    expect(viewport.documentWidth, route).toBeLessThanOrEqual(viewport.viewportWidth)
  }
  for (const endpoint of ['/api/users', '/api/roles', '/api/dictionaries/types', '/api/announcements', '/api/audit/logs']) {
    expect(adminPaths, endpoint).toContain(endpoint)
  }
})
