const $ = (selector, scope = document) => scope.querySelector(selector)
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)]

const htmlEscape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]))

function announce(message, region = $('#global-live')) {
  if (!region) return
  region.textContent = ''
  window.setTimeout(() => { region.textContent = message }, 10)
}

const root = document.documentElement
const themeSelect = $('#theme-select')
const densitySelect = $('#density-select')
const appearanceSelect = $('#appearance-select')
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

function applyAppearance(preference) {
  const resolved = preference === 'system' ? (systemDark.matches ? 'dark' : 'light') : preference
  root.dataset.appearance = resolved
  root.dataset.appearancePreference = preference
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

function applyPreferences() {
  root.dataset.theme = themeSelect.value
  root.dataset.density = densitySelect.value
  applyAppearance(appearanceSelect.value)
}

themeSelect.addEventListener('change', applyPreferences)
densitySelect.addEventListener('change', applyPreferences)
appearanceSelect.addEventListener('change', applyPreferences)
systemDark.addEventListener('change', () => {
  if (appearanceSelect.value === 'system') applyAppearance('system')
})
applyPreferences()

function switchScreen(target) {
  const screens = $$('[data-screen]')
  const safeTarget = screens.some((screen) => screen.dataset.screen === target) ? target : 'organization'
  for (const screen of screens) {
    const active = screen.dataset.screen === safeTarget
    screen.hidden = !active
    screen.setAttribute('aria-hidden', String(!active))
  }
  for (const button of $$('[data-screen-target]')) {
    button.setAttribute('aria-current', button.dataset.screenTarget === safeTarget ? 'page' : 'false')
  }
  $('#prototype-main').focus({ preventScroll: true })
  window.history.replaceState(null, '', `#${safeTarget}`)
}

for (const button of $$('[data-screen-target]')) {
  button.addEventListener('click', () => switchScreen(button.dataset.screenTarget))
}

const initialScreen = window.location.hash.slice(1)
if (initialScreen) switchScreen(initialScreen)

const organizations = [
  {
    id: 'org_rnd',
    parentId: null,
    code: 'RND',
    name: '研发中心',
    type: '部门',
    status: 'active',
    depth: 1,
    sortOrder: 10,
    leader: '林敏',
    updatedAt: '2026-11-15 10:42 UTC',
    activeMembers: 18,
  },
  {
    id: 'org_platform',
    parentId: 'org_rnd',
    code: 'PLATFORM',
    name: '平台研发部',
    type: '部门',
    status: 'active',
    depth: 2,
    sortOrder: 10,
    leader: '周航',
    updatedAt: '2026-11-15 10:42 UTC',
    activeMembers: 8,
  },
  {
    id: 'org_infra',
    parentId: 'org_platform',
    code: 'INFRA',
    name: '基础设施组',
    type: '团队',
    status: 'active',
    depth: 3,
    sortOrder: 10,
    leader: '陈立',
    updatedAt: '2026-11-14 16:20 UTC',
    activeMembers: 4,
  },
  {
    id: 'org_ai',
    parentId: 'org_rnd',
    code: 'AI',
    name: '人工智能部',
    type: '部门',
    status: 'active',
    depth: 2,
    sortOrder: 20,
    leader: '赵宁',
    updatedAt: '2026-11-14 09:12 UTC',
    activeMembers: 6,
  },
  {
    id: 'org_ops',
    parentId: 'org_rnd',
    code: 'OPS',
    name: '运营支持组',
    type: '团队',
    status: 'inactive',
    depth: 2,
    sortOrder: 30,
    leader: '钱悦',
    updatedAt: '2026-11-10 08:05 UTC',
    activeMembers: 0,
  },
]

const orgState = {
  expanded: new Set(['org_rnd', 'org_platform']),
  demoState: 'normal',
  editingId: null,
  statusTargetId: null,
  moveTargetId: null,
  lastFocus: null,
}

const byId = new Map(organizations.map((organization) => [organization.id, organization]))
const childrenOf = (id) => organizations
  .filter((organization) => organization.parentId === id)
  .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'zh-CN'))
const hasChildren = (id) => childrenOf(id).length > 0

function eligibleOrganizations() {
  const includeInactive = $('#org-include-inactive').checked
  const status = $('#org-status-filter').value
  return organizations.filter((organization) => {
    if (!includeInactive && organization.status !== 'active') return false
    if (status !== 'all' && organization.status !== status) return false
    return true
  })
}

function ancestorIds(id) {
  const result = []
  let current = byId.get(id)
  while (current?.parentId) {
    result.push(current.parentId)
    current = byId.get(current.parentId)
  }
  return result
}

function filteredOrganizationIds() {
  const eligible = eligibleOrganizations()
  const eligibleIds = new Set(eligible.map((organization) => organization.id))
  const query = $('#org-search').value.trim().toLocaleLowerCase('zh-CN')
  if (!query) return eligibleIds
  const matches = eligible.filter((organization) => (
    organization.name.toLocaleLowerCase('zh-CN').includes(query)
    || organization.code.toLocaleLowerCase('zh-CN').includes(query)
  ))
  const result = new Set()
  for (const organization of matches) {
    result.add(organization.id)
    for (const ancestorId of ancestorIds(organization.id)) {
      if (eligibleIds.has(ancestorId)) result.add(ancestorId)
    }
  }
  return result
}

function renderOrgRows() {
  const allowed = filteredOrganizationIds()
  const searching = $('#org-search').value.trim().length > 0
  const rows = []

  function walk(id, displayDepth) {
    if (!allowed.has(id)) return
    const organization = byId.get(id)
    if (!organization) return
    const children = childrenOf(id).filter((child) => allowed.has(child.id))
    const expanded = searching || orgState.expanded.has(id)
    rows.push(renderOrganizationRow(organization, displayDepth, children.length > 0, expanded))
    if (children.length > 0 && expanded) {
      for (const child of children) walk(child.id, displayDepth + 1)
    }
  }

  for (const organization of organizations.filter((item) => item.parentId === null).sort((left, right) => left.sortOrder - right.sortOrder)) {
    walk(organization.id, 1)
  }

  const table = $('#org-tree')
  table.innerHTML = `
    <caption>授权范围内机构树。使用方向键浏览，左右方向键展开或收起节点。</caption>
    <thead>
      <tr>
        <th scope="col">机构</th>
        <th scope="col">类型</th>
        <th scope="col">状态</th>
        <th scope="col">负责人</th>
        <th scope="col">最近更新</th>
        <th scope="col">操作</th>
      </tr>
    </thead>
    <tbody>${rows.join('') || '<tr><td colspan="6">没有可显示的机构。</td></tr>'}</tbody>
  `
}

function renderOrganizationRow(organization, displayDepth, hasVisibleChildren, expanded) {
  const lazyChildren = childrenOf(organization.id)
  const canExpand = hasVisibleChildren || lazyChildren.length > 0
  const statusLabel = organization.status === 'active' ? '启用' : '停用'
  const statusClass = organization.status === 'active' ? 'prototype-status--active' : 'prototype-status--inactive'
  const nextStatusLabel = organization.status === 'active' ? '停用' : '启用'
  return `
    <tr role="row" data-org-row="${htmlEscape(organization.id)}" aria-level="${displayDepth}" ${canExpand ? `aria-expanded="${expanded}"` : ''}>
      <th role="gridcell" scope="row">
        <div class="prototype-row-primary" style="--prototype-depth:${displayDepth}">
          ${canExpand ? `<button type="button" class="prototype-tree-toggle" data-org-toggle="${htmlEscape(organization.id)}" aria-label="${expanded ? '收起' : '展开'}${htmlEscape(organization.name)}" aria-expanded="${expanded}">▾</button>` : '<span class="prototype-row-spacer" aria-hidden="true"></span>'}
          <button type="button" class="prototype-row-name" data-row-focus="${htmlEscape(organization.id)}" ${canExpand ? `aria-expanded="${expanded}"` : ''}>
            <strong>${htmlEscape(organization.name)}</strong>
            <small>${htmlEscape(organization.code)} · 第 ${displayDepth} 级</small>
          </button>
        </div>
      </th>
      <td role="gridcell" data-label="类型">${htmlEscape(organization.type)}</td>
      <td role="gridcell" data-label="状态"><span class="prototype-status ${statusClass}">${statusLabel}</span></td>
      <td role="gridcell" data-label="负责人">${htmlEscape(organization.leader)}</td>
      <td role="gridcell" data-label="最近更新">${htmlEscape(organization.updatedAt)}</td>
      <td role="gridcell" data-label="操作">
        <div class="prototype-row-actions">
          <button type="button" class="prototype-row-action" data-org-action="edit" data-org-id="${htmlEscape(organization.id)}">编辑</button>
          <button type="button" class="prototype-row-action" data-org-action="move" data-org-id="${htmlEscape(organization.id)}">移动</button>
          <button type="button" class="prototype-row-action" data-org-action="status" data-org-id="${htmlEscape(organization.id)}">${nextStatusLabel}</button>
          <button type="button" class="prototype-row-action" data-org-action="create-child" data-org-id="${htmlEscape(organization.id)}">新建子机构</button>
        </div>
      </td>
    </tr>
  `
}

function orgStatePanel(kind, title, description) {
  const mark = kind === 'loading' ? '<span class="prototype-feedback__spinner" aria-hidden="true"></span>' : `<span class="prototype-state-mark" aria-hidden="true">${kind === 'forbidden' ? '403' : kind === 'not-found' ? '404' : kind === 'error' ? '!' : '○'}</span>`
  return `<div class="prototype-state-panel">${mark}<h3>${htmlEscape(title)}</h3><p>${htmlEscape(description)}</p>${kind === 'error' || kind === 'not-found' ? '<button type="button" class="prototype-button" data-org-action="reload">重新加载</button>' : ''}</div>`
}

function setOrgBanner(kind, message) {
  const banner = $('#org-banner')
  if (!kind) {
    banner.hidden = true
    banner.textContent = ''
    return
  }
  banner.hidden = false
  banner.className = `prototype-banner ${kind === 'error' ? 'prototype-banner--error' : kind === 'info' ? 'prototype-banner--info' : ''}`.trim()
  banner.textContent = message
}

function renderOrganizationState() {
  const table = $('#org-tree')
  const panel = $('#org-state-panel')
  const region = $('#org-table-region')
  const state = orgState.demoState
  const query = $('#org-search').value.trim()
  const allowed = filteredOrganizationIds()
  const normalHasRows = allowed.size > 0
  let showTable = true
  let panelHtml = ''
  let busy = false

  setOrgBanner(null)
  if (state === 'loading') {
    showTable = false
    busy = true
    panelHtml = `<div class="prototype-skeleton" aria-label="机构树加载中"><span></span><span></span><span></span><span></span></div>`
  } else if (state === 'empty') {
    showTable = false
    panelHtml = orgStatePanel('empty', '当前范围暂无机构', '请联系租户管理员初始化组织树，或检查数据范围。')
  } else if (state === 'filter-empty' || (state === 'normal' && query && !normalHasRows)) {
    showTable = false
    panelHtml = orgStatePanel('empty', '没有匹配的机构', '保留当前筛选条件，调整关键词或重置筛选。')
  } else if (state === 'forbidden') {
    showTable = false
    panelHtml = orgStatePanel('forbidden', '无权访问机构管理', '当前账号缺少 iam:organization:read，页面不展示任何机构数据。')
  } else if (state === 'not-found') {
    showTable = false
    panelHtml = orgStatePanel('not-found', '机构不存在或不在数据范围', '为避免枚举，范围外对象与不存在对象使用同一不可用状态。')
  } else if (state === 'network') {
    showTable = false
    panelHtml = orgStatePanel('error', '网络超时', '请求未获得可靠结果。页面不会猜测操作成功；请稍后重试。')
  } else if (state === 'server') {
    showTable = false
    panelHtml = orgStatePanel('error', '服务暂不可用', '保留 request_id 便于排障，不自动重复写操作。')
  } else if (state === 'conflict') {
    setOrgBanner('warning', '409 ORG_HAS_ACTIVE_CHILDREN：停用前必须先处理启用子节点。')
  } else if (state === 'version') {
    setOrgBanner('warning', '412 ORG_VERSION_CONFLICT：数据已被其他请求修改，请重新加载后再次确认。')
  }

  region.setAttribute('aria-busy', String(busy))
  table.hidden = !showTable
  panel.hidden = showTable
  panel.innerHTML = panelHtml
  if (showTable) renderOrgRows()
}

function refreshOrgView() {
  renderOrganizationState()
}

$('#org-search').addEventListener('input', refreshOrgView)
$('#org-status-filter').addEventListener('change', refreshOrgView)
$('#org-include-inactive').addEventListener('change', refreshOrgView)
$('#org-demo-state').addEventListener('change', (event) => {
  orgState.demoState = event.target.value
  refreshOrgView()
  if (orgState.demoState !== 'normal') announce(`已切换到 ${event.target.selectedOptions[0].textContent} 状态`)
})

$('#org-tree').addEventListener('click', (event) => {
  const toggle = event.target.closest('[data-org-toggle]')
  if (toggle) {
    const id = toggle.dataset.orgToggle
    if (orgState.expanded.has(id)) orgState.expanded.delete(id)
    else orgState.expanded.add(id)
    refreshOrgView()
    const nextToggle = $(`[data-org-toggle="${CSS.escape(id)}"]`)
    nextToggle?.focus()
    announce(`${byId.get(id)?.name ?? '机构'}${orgState.expanded.has(id) ? '已展开' : '已收起'}`)
    return
  }

  const focusButton = event.target.closest('[data-row-focus]')
  if (focusButton) {
    const id = focusButton.dataset.rowFocus
    if (hasChildren(id)) {
      if (orgState.expanded.has(id)) orgState.expanded.delete(id)
      else orgState.expanded.add(id)
      refreshOrgView()
      $(`[data-row-focus="${CSS.escape(id)}"]`)?.focus()
      announce(`${byId.get(id)?.name ?? '机构'}${orgState.expanded.has(id) ? '已展开' : '已收起'}`)
    }
    return
  }

  const action = event.target.closest('[data-org-action]')
  if (!action) return
  const id = action.dataset.orgId
  if (action.dataset.orgAction === 'edit') openOrgDrawer('edit', id)
  else if (action.dataset.orgAction === 'move') openMoveDialog(id)
  else if (action.dataset.orgAction === 'status') openStatusDialog(id)
  else if (action.dataset.orgAction === 'create-child') openOrgDrawer('create', null, id)
  else if (action.dataset.orgAction === 'reload') {
    orgState.demoState = 'normal'
    $('#org-demo-state').value = 'normal'
    refreshOrgView()
    announce('机构数据已重新加载')
  }
})

$('#org-tree').addEventListener('keydown', (event) => {
  const current = event.target.closest('[data-row-focus]')
  if (!current) return
  const focusable = $$('[data-row-focus]', $('#org-tree'))
  const index = focusable.indexOf(current)
  const id = current.dataset.rowFocus
  const organization = byId.get(id)
  if (!organization) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusable[Math.min(index + 1, focusable.length - 1)]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusable[Math.max(index - 1, 0)]?.focus()
  } else if (event.key === 'Home') {
    event.preventDefault()
    focusable[0]?.focus()
  } else if (event.key === 'End') {
    event.preventDefault()
    focusable.at(-1)?.focus()
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    if (hasChildren(id) && !orgState.expanded.has(id)) {
      orgState.expanded.add(id)
      refreshOrgView()
      $(`[data-row-focus="${CSS.escape(id)}"]`)?.focus()
      announce(`${organization.name}已展开`)
    } else if (hasChildren(id)) {
      const firstChild = childrenOf(id).find((child) => filteredOrganizationIds().has(child.id))
      if (firstChild) $(`[data-row-focus="${CSS.escape(firstChild.id)}"]`)?.focus()
    }
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    if (hasChildren(id) && orgState.expanded.has(id)) {
      orgState.expanded.delete(id)
      refreshOrgView()
      $(`[data-row-focus="${CSS.escape(id)}"]`)?.focus()
      announce(`${organization.name}已收起`)
    } else if (organization.parentId) {
      $(`[data-row-focus="${CSS.escape(organization.parentId)}"]`)?.focus()
    }
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    current.click()
  }
})

function trapFocus(container, event) {
  if (event.key !== 'Tab') return
  const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
    .filter((element) => !element.disabled && element.offsetParent !== null)
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function openOrgDrawer(mode, organizationId = null, parentId = null) {
  orgState.lastFocus = document.activeElement
  orgState.editingId = mode === 'edit' ? organizationId : null
  const organization = organizationId ? byId.get(organizationId) : null
  $('#org-drawer-title').textContent = mode === 'edit' ? '编辑机构' : '新建机构'
  $('#org-code').value = organization?.code ?? ''
  $('#org-code').readOnly = mode === 'edit'
  $('#org-name').value = organization?.name ?? ''
  $('#org-form-error').hidden = true
  const parentSelect = $('#org-parent')
  if (parentId) parentSelect.value = byId.get(parentId)?.name ?? parentSelect.options[0]?.textContent ?? ''
  $('#drawer-overlay').hidden = false
  $('#org-drawer').hidden = false
  document.body.style.overflow = 'hidden'
  window.setTimeout(() => $(mode === 'edit' ? '#org-name' : '#org-code').focus(), 0)
}

function closeOrgDrawer({ restoreFocus = true } = {}) {
  $('#drawer-overlay').hidden = true
  $('#org-drawer').hidden = true
  document.body.style.overflow = ''
  if (restoreFocus && orgState.lastFocus instanceof HTMLElement) orgState.lastFocus.focus()
}

$('#org-create-button').addEventListener('click', () => openOrgDrawer('create'))
for (const button of $$('[data-close-drawer]')) button.addEventListener('click', () => closeOrgDrawer())
$('#drawer-overlay').addEventListener('click', (event) => {
  if (event.target === $('#drawer-overlay')) closeOrgDrawer()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#drawer-overlay').hidden) {
    event.preventDefault()
    closeOrgDrawer()
    return
  }
  if (!$('#drawer-overlay').hidden) trapFocus($('#org-drawer'), event)
})

$('#org-form').addEventListener('submit', (event) => {
  event.preventDefault()
  const code = $('#org-code').value.trim()
  const name = $('#org-name').value.trim()
  const error = $('#org-form-error')
  error.hidden = true
  if (!code || !name) {
    error.textContent = '请填写机构编码和名称。'
    error.hidden = false
    $(!code ? '#org-code' : '#org-name').focus()
    return
  }

  if (orgState.editingId) {
    const organization = byId.get(orgState.editingId)
    if (organization) {
      organization.name = name
      organization.updatedAt = '刚刚 · 原型本地状态'
    }
    closeOrgDrawer()
    refreshOrgView()
    announce(`${name} 已保存（原型本地状态）`)
    return
  }

  if (organizations.some((organization) => organization.code.toLocaleLowerCase('zh-CN') === code.toLocaleLowerCase('zh-CN'))) {
    error.textContent = '409 ORG_CODE_CONFLICT：机构编码在当前租户内重复。'
    error.hidden = false
    $('#org-code').focus()
    return
  }

  const parentName = $('#org-parent').value
  const parent = organizations.find((organization) => organization.name === parentName)
  const id = `org_local_${Date.now()}`
  const siblingCount = organizations.filter((organization) => organization.parentId === (parent?.id ?? null)).length
  organizations.push({
    id,
    parentId: parent?.id ?? 'org_rnd',
    code,
    name,
    type: '部门',
    status: 'active',
    depth: (parent?.depth ?? 1) + 1,
    sortOrder: (siblingCount + 1) * 10,
    leader: '待分配',
    updatedAt: '刚刚 · 原型本地状态',
    activeMembers: 0,
  })
  byId.set(id, organizations.at(-1))
  orgState.expanded.add(parent?.id ?? 'org_rnd')
  closeOrgDrawer()
  refreshOrgView()
  announce(`${name} 已创建（原型本地状态）`)
})

function closeDialog(dialog) {
  if (dialog?.open) dialog.close()
}

for (const button of $$('[data-close-dialog]')) {
  button.addEventListener('click', () => closeDialog(button.closest('dialog')))
}

function openMoveDialog(organizationId) {
  const organization = byId.get(organizationId)
  if (!organization) return
  orgState.moveTargetId = organizationId
  orgState.lastFocus = document.activeElement
  $('#move-source-name').textContent = organization.name
  $('#move-error').hidden = true
  $('#move-target').value = '集团总部'
  $('#move-dialog').showModal()
  window.setTimeout(() => $('#move-target').focus(), 0)
}

$('#move-confirm').addEventListener('click', () => {
  const organization = byId.get(orgState.moveTargetId)
  const targetName = $('#move-target').value
  const error = $('#move-error')
  error.hidden = true
  if (!organization) return
  if (targetName === organization.name) {
    error.textContent = '409 ORG_CYCLE：目标不能是机构自身或其子树。'
    error.hidden = false
    announce(error.textContent)
    return
  }
  closeDialog($('#move-dialog'))
  organization.updatedAt = '刚刚 · 原型本地状态'
  announce(`${organization.name} 已移动到 ${targetName}（原型本地状态）`)
  refreshOrgView()
})

function openStatusDialog(organizationId) {
  const organization = byId.get(organizationId)
  if (!organization) return
  orgState.statusTargetId = organizationId
  orgState.lastFocus = document.activeElement
  const activating = organization.status === 'inactive'
  $('#status-title').textContent = activating ? '启用机构' : '停用机构'
  $('#status-target-name').textContent = organization.name
  const impact = $('.prototype-impact-box', $('#status-dialog'))
  const activeChildren = childrenOf(organizationId).filter((child) => child.status === 'active').length
  if (activating) {
    impact.innerHTML = '<strong>启用后，机构将重新进入可分配范围。</strong><p>父机构必须处于启用状态；操作会递增相关权限版本。</p>'
    impact.classList.remove('prototype-impact-box--warning')
  } else {
    impact.innerHTML = `<strong>当前存在 ${activeChildren} 个启用子节点、${organization.activeMembers} 名活动成员。</strong><p>存在启用子节点或活动成员时，服务端返回稳定业务冲突，不允许级联停用。</p>`
    impact.classList.add('prototype-impact-box--warning')
  }
  $('#status-confirm').textContent = activating ? '确认启用' : '确认停用'
  $('#status-confirm').className = `prototype-button ${activating ? 'prototype-button--primary' : 'prototype-button--danger'}`
  $('#status-dialog').showModal()
  window.setTimeout(() => $('#status-dialog [data-close-dialog]').focus(), 0)
}

$('#status-confirm').addEventListener('click', () => {
  const organization = byId.get(orgState.statusTargetId)
  if (!organization) return
  const activeChildren = childrenOf(organization.id).filter((child) => child.status === 'active').length
  if (organization.status === 'active' && (activeChildren > 0 || organization.activeMembers > 0)) {
    const code = activeChildren > 0 ? 'ORG_HAS_ACTIVE_CHILDREN' : 'ORG_HAS_ACTIVE_MEMBERS'
    announce(`409 ${code}：必须先处理子节点或活动成员`)
    closeDialog($('#status-dialog'))
    orgState.demoState = 'conflict'
    $('#org-demo-state').value = 'conflict'
    refreshOrgView()
    return
  }
  organization.status = organization.status === 'active' ? 'inactive' : 'active'
  organization.updatedAt = '刚刚 · 原型本地状态'
  closeDialog($('#status-dialog'))
  refreshOrgView()
  announce(`${organization.name} 已${organization.status === 'active' ? '启用' : '停用'}（原型本地状态）`)
})

const permissionGroups = [
  {
    id: 'organization',
    label: '机构',
    permissions: [
      { key: 'iam:organization:read', label: '查看机构', baseline: true },
      { key: 'iam:organization:create', label: '创建机构', baseline: true },
      { key: 'iam:organization:update', label: '编辑机构', baseline: true },
      { key: 'iam:organization:move', label: '移动机构', baseline: false, protectedReason: '高风险动作' },
      { key: 'iam:organization:update-status', label: '启停机构', baseline: false, protectedReason: '高风险动作' },
    ],
  },
  {
    id: 'users',
    label: '用户',
    permissions: [
      { key: 'iam:user:read', label: '查看用户', baseline: true },
      { key: 'iam:user:update', label: '编辑用户', baseline: true },
      { key: 'iam:user:assign-role', label: '分配角色', baseline: false },
      { key: 'iam:user:reset-credentials', label: '重置凭证', baseline: false, protectedReason: '需租户管理员' },
    ],
  },
  {
    id: 'announcement',
    label: '公告',
    permissions: [
      { key: 'content:announcement:read', label: '查看公告', baseline: true },
      { key: 'content:announcement:create', label: '创建草稿', baseline: true },
      { key: 'content:announcement:update', label: '编辑草稿', baseline: true },
      { key: 'content:announcement:publish', label: '发布公告', baseline: false, protectedReason: '需租户管理员' },
      { key: 'content:announcement:withdraw', label: '撤回公告', baseline: false, protectedReason: '需租户管理员' },
    ],
  },
  {
    id: 'audit',
    label: '审计',
    permissions: [
      { key: 'audit:log:read', label: '查看审计列表', baseline: false, protectedReason: '仅审计员/租户管理员' },
      { key: 'audit:log:detail', label: '查看审计详情', baseline: false, protectedReason: '仅审计员/租户管理员' },
    ],
  },
]

const roleDefinitions = {
  tenant_admin: {
    label: '租户管理员',
    builtIn: true,
    description: '内置角色不可编辑；需要调整时复制为自定义角色。',
    checked: new Set(permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.key))),
  },
  org_admin: {
    label: '机构管理员',
    builtIn: true,
    description: '内置角色不可编辑；权限与数据范围受机构子树限制。',
    checked: new Set(['iam:organization:read', 'iam:organization:create', 'iam:organization:update', 'iam:user:read', 'iam:user:update', 'content:announcement:read', 'content:announcement:create', 'content:announcement:update']),
  },
  content_editor: {
    label: '内容运营',
    builtIn: false,
    description: '自定义角色属于当前租户；下列控件演示权限矩阵交互。',
    checked: new Set(permissionGroups.flatMap((group) => group.permissions.filter((permission) => permission.baseline).map((permission) => permission.key))),
  },
}

let currentRole = 'content_editor'
const roleBaselines = Object.fromEntries(Object.entries(roleDefinitions).map(([key, value]) => [key, new Set(value.checked)]))

function currentRoleDefinition() {
  return roleDefinitions[currentRole]
}

function updateGroupState(groupElement) {
  const inputs = $$('input[data-permission-key]', groupElement)
  const checked = inputs.filter((input) => input.checked).length
  const groupInput = $('input[data-group-toggle]', groupElement)
  if (!groupInput) return
  groupInput.checked = checked === inputs.length
  groupInput.indeterminate = checked > 0 && checked < inputs.length
}

function updatePermissionSummary() {
  const definition = currentRoleDefinition()
  const baseline = roleBaselines[currentRole]
  const current = new Set($$('input[data-permission-key]:checked').map((input) => input.dataset.permissionKey))
  let added = 0
  let removed = 0
  for (const key of current) if (!baseline.has(key)) added += 1
  for (const key of baseline) if (!current.has(key)) removed += 1
  const summary = $('#permission-change-summary')
  summary.textContent = added + removed === 0 ? '尚未修改' : `新增 ${added} 项，移除 ${removed} 项`
  $('#permission-save').disabled = added + removed === 0 || definition.builtIn
  return { added, removed, changed: added + removed }
}

function applyChangesOnlyFilter() {
  const onlyChanges = $('#permission-changes-only').checked
  const baseline = roleBaselines[currentRole]
  for (const groupElement of $$('.prototype-permission-group')) {
    let visible = 0
    for (const cell of $$('.prototype-permission-cell', groupElement)) {
      const input = $('input[data-permission-key]', cell)
      const changed = input.checked !== baseline.has(input.dataset.permissionKey)
      cell.hidden = onlyChanges && !changed
      if (!cell.hidden) visible += 1
    }
    groupElement.hidden = onlyChanges && visible === 0
  }
}

function renderPermissionGroups() {
  const container = $('.prototype-permission-groups')
  const definition = currentRoleDefinition()
  container.innerHTML = permissionGroups.map((group) => `
    <section class="prototype-permission-group" data-permission-group="${group.id}">
      <div class="prototype-permission-group-header">
        <label class="prototype-checkbox">
          <input type="checkbox" data-group-toggle="${group.id}" ${definition.builtIn ? 'disabled' : ''} />
          <span>${htmlEscape(group.label)}</span>
        </label>
      </div>
      <div class="prototype-permission-grid">
        ${group.permissions.map((permission) => {
          const checked = definition.checked.has(permission.key)
          const disabled = definition.builtIn || Boolean(permission.protectedReason)
          return `
            <label class="prototype-permission-cell">
              <input
                type="checkbox"
                data-permission-key="${htmlEscape(permission.key)}"
                ${checked ? 'checked' : ''}
                ${disabled ? 'disabled' : ''}
              />
              <span>${htmlEscape(permission.label)}</span>
              ${permission.protectedReason ? `<small>受保护：${htmlEscape(permission.protectedReason)}</small>` : ''}
            </label>
          `
        }).join('')}
      </div>
    </section>
  `).join('')

  for (const groupElement of $$('.prototype-permission-group')) updateGroupState(groupElement)
  $('#permission-role-title').textContent = definition.label
  $('#permission-role-description').textContent = definition.description
  const badge = $('#permission-role-badge')
  badge.textContent = definition.builtIn ? '受保护' : '自定义'
  badge.className = `prototype-badge ${definition.builtIn ? 'prototype-badge--protected' : ''}`.trim()
  $('#permission-changes-only').checked = false
  updatePermissionSummary()
}

$('.prototype-permission-groups').addEventListener('change', (event) => {
  const groupToggle = event.target.closest('[data-group-toggle]')
  if (groupToggle) {
    const groupElement = groupToggle.closest('.prototype-permission-group')
    for (const input of $$('input[data-permission-key]', groupElement)) {
      if (!input.disabled) input.checked = groupToggle.checked
    }
    updateGroupState(groupElement)
  }
  const permissionToggle = event.target.closest('[data-permission-key]')
  if (permissionToggle) updateGroupState(permissionToggle.closest('.prototype-permission-group'))
  updatePermissionSummary()
  applyChangesOnlyFilter()
})

$('#permission-changes-only').addEventListener('change', applyChangesOnlyFilter)
$('#permission-save').addEventListener('click', () => {
  if (currentRoleDefinition().builtIn) {
    announce('内置角色受保护，不能保存权限修改')
    return
  }
  const { changed } = updatePermissionSummary()
  if (changed === 0) return
  announce(`权限矩阵已保存 ${changed} 项变更（原型本地状态，不调用后端）`)
})

$('#permission-reset').addEventListener('click', () => {
  const definition = currentRoleDefinition()
  definition.checked = new Set(roleBaselines[currentRole])
  renderPermissionGroups()
  announce('权限矩阵修改已重置')
})

for (const button of $$('[data-role]')) {
  button.addEventListener('click', () => {
    currentRole = button.dataset.role
    for (const candidate of $$('[data-role]')) candidate.setAttribute('aria-pressed', String(candidate === button))
    renderPermissionGroups()
    announce(`已切换到${currentRoleDefinition().label}权限矩阵`)
  })
}

$('#role-search').addEventListener('input', (event) => {
  const query = event.target.value.trim().toLocaleLowerCase('zh-CN')
  for (const button of $$('[data-role]')) {
    button.hidden = Boolean(query) && !button.textContent.toLocaleLowerCase('zh-CN').includes(query)
  }
})

renderPermissionGroups()

$('#announcement-preview').addEventListener('click', () => {
  const stamp = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')
  $('#announcement-preview-time').textContent = `生成时间：${stamp}`
  announce('公告预览快照已重新生成；受众仍为研发中心及子树、租户管理员。')
})

let pendingConfirm = null

function openConfirmDialog({ title, message, confirmLabel = '确认', danger = false, onConfirm }) {
  $('#generic-dialog-title').textContent = title
  $('#generic-dialog-message').textContent = message
  const confirm = $('#generic-dialog-confirm')
  confirm.textContent = confirmLabel
  confirm.className = `prototype-button ${danger ? 'prototype-button--danger' : 'prototype-button--primary'}`
  pendingConfirm = onConfirm
  $('#generic-dialog').showModal()
  window.setTimeout(() => confirm.focus(), 0)
}

$('#generic-dialog-confirm').addEventListener('click', () => {
  const callback = pendingConfirm
  pendingConfirm = null
  closeDialog($('#generic-dialog'))
  callback?.()
})

$('#announcement-withdraw').addEventListener('click', () => {
  openConfirmDialog({
    title: '撤回公告',
    message: '撤回后公告从已发布范围移除，但历史阅读记录保留策略仍待产品确认。已发布内容不会原地修改。',
    confirmLabel: '确认撤回',
    danger: true,
    onConfirm: () => {
      const headerBadge = $('#announcement-status-badge')
      headerBadge.textContent = 'withdrawn'
      headerBadge.className = 'prototype-badge prototype-badge--inactive'
      const panelBadge = $('#announcement-panel-status')
      panelBadge.textContent = '已撤回'
      panelBadge.className = 'prototype-badge prototype-badge--inactive'
      $('#announcement-withdraw').disabled = true
      announce('公告已撤回（原型本地状态）；历史阅读记录策略仍待确认。')
    },
  })
})

$('#copy-request-id').addEventListener('click', async () => {
  const value = $('#audit-request-id').textContent?.trim() ?? ''
  try {
    await navigator.clipboard.writeText(value)
    announce(`已复制 request_id：${value}`)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.append(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
    announce(`已复制 request_id：${value}`)
  }
})

for (const button of $$('.prototype-audit-item')) {
  button.addEventListener('click', () => {
    for (const candidate of $$('.prototype-audit-item')) candidate.setAttribute('aria-pressed', String(candidate === button))
    announce(`已选择审计事件：${button.querySelector('strong')?.textContent ?? ''}`)
  })
}

refreshOrgView()
