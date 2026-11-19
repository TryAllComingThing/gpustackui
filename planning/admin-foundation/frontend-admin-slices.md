# 基础管理五个前端切片：需求、设计与交付边界

- 变更 ID：`admin-foundation`
- 状态：`FRONTEND ADMIN SLICES ACCEPTED / CONTRACT ADAPTER + MOCK INTEGRATION`
- 日期：2026-11-16
- 验收日期：2026-11-19
- 范围：用户、角色、数据字典、公告、审计日志
- 任务级别：L3（跨五个模块、API 契约适配、路由、导航、i18n、测试与规划文档；不冻结后端契约）
- 结论：五个页面已接入 `src/api/<domain>/` 的草案契约适配层，并通过 mock API 集成测试。本轮验收只要求前端契约适配与 mock 集成，不要求真实环境联调。

## 1. 需求基线

### 1.1 目标

为租户管理员提供一套可评审、可交互、可访问的基础管理前端切片，覆盖：

1. 用户查询、资料维护、角色绑定、数据范围查看和账号状态管理；
2. 角色查询、权限矩阵维护、内置角色保护、自定义角色创建与复制；
3. 字典类型与字典项的主从维护、默认项、排序和缓存刷新交互；
4. 公告草稿、受众组合、预览、计划发布、发布与撤回；
5. 审计日志只读查询、深链接详情、关联事件、脱敏字段和 `request_id` 复制。

### 1.2 非目标

- 不开发或部署后端服务，不新增未登记端点，不把草案适配层描述为已冻结后端契约。
- 不进行真实环境联调、真实数据迁移或生产部署验收。
- 不把本地 fixtures、页面交互或前端路由守卫描述为服务端能力。
- 不实现 IdP、SSO/OIDC/SAML、服务端 RBAC、租户切换、审计投递或数据持久化。
- 不扩展 `AuthPermission`，不虚构细粒度前端权限；本切片统一使用现有 `requiresAuth + requiresAdmin`。
- 不修改认证、会话、错误处理或既有业务 API 的语义。
- 不新增公共业务组件；权限矩阵、公告预览和审计详情保持模块私有。
- 不修改主题 Token、生成主题 CSS 或 Nuxt UI 桥接变量。

### 1.3 完成条件

- 五个模块均有 `pages/`、`routes.ts`、`index.ts`、可测试的领域模型和对应 `src/api/<domain>/` 草案契约适配层。
- 路由、导航、中英文 i18n、单元测试、E2E、可访问性测试已同步。
- 页面通过 API 加载和提交数据，并展示 loading、empty、error、retry 与写失败状态；fixtures 只作为 E2E mock 种子。
- 320px 视口无页面级横向滚动；新增路由通过 axe 自动检查。
- 文档明确本轮验收边界为前端契约适配与 mock 集成，真实环境联调不在范围内。

## 2. 信息架构与路由

| 模块 | 路径 | 路由名 | 导航组 | 页面 |
|---|---|---|---|---|
| 用户管理 | `/system/users` | `iam-user-list` | `iam` | `UsersPage.vue` |
| 角色管理 | `/system/roles` | `iam-role-list` | `iam` | `RolesPage.vue` |
| 数据字典 | `/system/dictionaries` | `system-dictionary-list` | `configuration` | `DictionariesPage.vue` |
| 公告管理 | `/content/announcements` | `content-announcement-list` | `content` | `AnnouncementsPage.vue` |
| 审计列表 | `/audit/logs` | `audit-log-list` | `security` | `AuditLogsPage.vue` |
| 审计详情 | `/audit/logs/:eventId` | `audit-log-detail` | 无独立导航项 | `AuditLogDetailPage.vue` |

所有路由使用 `requiresAuth: true` 与 `requiresAdmin: true`。这只是前端导航与访问展示守卫，不是后端授权边界。

## 3. 统一数据模型

### 3.1 共用枚举

`src/types/admin.ts` 统一定义：

- `AdminStatus = 'active' | 'inactive'`
- `DataScope = 'self' | 'org' | 'org_subtree' | 'all'`

四种数据范围仅作为页面展示、角色绑定编辑和本地模型输入；真实范围计算必须由后端完成，前端不得通过角色名或查询参数扩大范围。

### 3.2 用户

核心字段：`id`、用户名、显示名、邮箱、单机构、来源（`local | sso`）、状态、角色绑定、最后登录时间、版本、是否当前用户、是否最后租户管理员。

约束：

- 用户当前只属于一个机构。
- 角色绑定包含 `role_id`、角色名称和四种数据范围之一。
- 禁止停用自己。
- 禁止停用最后一个租户管理员。
- 最后一个租户管理员必须保留 `tenant_admin` 角色且数据范围为 `all`；移除角色或缩小范围均失败关闭。
- 每次授权或状态变更后重新计算 `is_last_tenant_admin`，避免多个用户同时被标记为“最后管理员”。
- 资料与授权分区独立保存，任一区域有未保存变更时关闭 Drawer 需确认。
- 重置凭证和强制退出需要二次确认。

### 3.3 角色

核心字段：`id`、编码、名称、描述、是否内置、状态、数据范围、权限集合、用户数、版本、更新时间。

约束：

- 内置模板角色受保护，不允许编辑权限、名称、范围或启停。
- 自定义角色为租户级，可创建、编辑、复制和启停。
- 权限矩阵按机构、用户、角色、字典、公告、审计分组。
- 组级复选框支持全选、半选和取消；保存前显示实际权限变更数量。
- 名称、说明、数据范围或权限任一变化都构成脏状态并可保存，不只统计权限数量。
- 切换角色、创建副本、启停或新建角色前，如存在未保存修改必须确认放弃。
- 角色定义写操作仅面向当前租户；本切片不提供跨租户切换。

### 3.4 数据字典

核心字段：

- 类型：`id`、编码、名称、描述、状态、版本、更新时间；
- 字典项：`id`、`type_id`、编码、名称、排序、是否默认、状态、描述、更新时间。

约束：

- 类型与字典项分开维护和保存。
- 活动字典项存在时禁止停用类型。
- 默认字典项必须保持启用。
- 同一类型仍有其他活动项时，必须先迁移默认项再停用当前默认项。
- 默认项是该类型最后一个活动项时可被停用，停用后不保留默认项，从而允许随后停用整个类型。
- 同一类型只能有一个默认项。
- 编码创建后不原地修改；重名编码失败关闭。
- 首期只停用，不提供删除。

### 3.5 公告

状态：`draft`、`scheduled`、`published`、`withdrawn`、`expired`。

允许转换：

- `draft → scheduled`
- `draft → published`
- `scheduled → withdrawn`
- `scheduled → published`（系统按时发布）
- `scheduled → expired`（系统到期）
- `published → withdrawn`
- `published → expired`（系统到期）
- 已撤回内容复制为新草稿

约束：

- 仅草稿可原地编辑。
- 已发布内容只读，只能复制为新草稿。
- 受众规则可组合：全体、机构集合、角色集合；选择全体时机构与角色规则禁用。
- 发布或计划发布前可生成本地预览快照。
- 发布、计划发布和撤回均需确认；失败使用独立错误提示。
- 保存草稿标题必填；发布或计划发布还要求正文和至少一个受众规则。
- 计划发布时间必须晚于当前时间；`datetime-local` 与服务端 UTC 时间双向转换，不直接截断 ISO 字符串。
- 选择“全体用户”时清空机构和角色规则；复制公告深拷贝受众数组。
- 切换公告、复制或新建草稿前，如存在未保存修改必须确认放弃。
- 首期不做多语言公告、富文本编辑器或模板市场。

### 3.6 审计日志

核心字段：事件 ID、发生时间、操作者、动作、资源、结果、`request_id`、来源 IP、User-Agent、变化集合、关联事件。

约束：

- 页面只读，不提供编辑、删除或导出入口。
- 列表支持动作、结果、关键词和 UTC 日期范围筛选。
- 动作筛选目录必须覆盖全部本地事件类型，并通过 i18n 渲染可见标签。
- 详情支持深链接；未知事件展示空状态。
- 同一 `request_id` 或显式关联 ID 的事件可互相跳转。
- 脱敏字段统一显示 `[已脱敏]`，不把原始敏感值写入页面。
- “首期仅保存”是后端审计保留策略要求；前端不提供归档或删除操作。

## 4. 页面交互设计

### 4.1 用户管理

- 主视图为 `DataTablePattern + UDataTable`，支持关键词、状态、机构和来源筛选。
- 行操作打开右侧 `UDrawer`；Drawer 包含资料、授权、有效权限、凭证三个职责区。
- 资料区显示单机构约束；授权区支持增删角色绑定和修改数据范围。
- 有效权限按本地角色目录推导，仅用于交互预览，不代表服务端最终授权。
- 停用操作失败时展示保护原因；不得把不可停用项伪装成可操作。

### 4.2 角色管理

- 左侧为角色列表与筛选，右侧为当前角色详情和权限矩阵。
- 内置角色给出保护说明，字段与复选框只读。
- 权限组复选框支持 `indeterminate`；权限项使用可见名称、权限码和完整可访问名称。
- 保存按钮仅在真实变更时可用；重置恢复已保存值。
- 自定义角色创建使用 `ComplexFormPattern`，复制角色生成新编码且不复制用户绑定。

### 4.3 数据字典

- 左侧为字典类型，右侧为所选类型的元数据、操作和字典项表格。
- 类型和字典项分别通过标准 Modal 表单编辑。
- 字典项操作包括编辑、设默认和启停；不可用操作必须给出明确原因。
- 缓存刷新为本地反馈动作，不声称已调用服务端缓存。
- 窄屏下主从布局改为单列，表格保持可横向滚动，不造成页面级溢出。

### 4.4 公告管理

- 左侧为公告列表与状态筛选，右侧为编辑器、受众和操作区。
- 草稿可编辑标题、正文、机构受众和角色受众；预览使用当前本地草稿快照。
- `published`、`withdrawn`、`expired` 状态只读，并提供复制草稿入口。
- 发布、计划发布、撤回使用确认 Modal；成功后通过 live region 播报。
- 计划时间必须可解析；非法时间在确认前直接报错。

### 4.5 审计日志

- 列表复用 `DataTablePattern`，提供动作、结果、关键词和日期筛选。
- 详情为独立路由，展示事件事实、变化、关联事件和只读边界说明。
- `request_id` 提供复制按钮及成功/失败播报。
- 空结果和不存在的事件使用明确文本状态，不只依赖颜色。

## 5. 前端数据边界与未来契约

### 5.1 当前实现

五个模块通过对应 `src/api/<domain>/` 公共入口消费草案契约；模块内 fixtures 只用于测试 mock 种子：

- 用户：7 条，覆盖本地账号、SSO、停用用户和多角色摘要；
- 角色：5 个角色及完整本地权限目录；
- 字典：4 个类型、10 个字典项；
- 公告：5 条，覆盖全部生命周期状态；
- 审计：8 条事件，覆盖成功、失败、关联事件与脱敏字段。

页面加载、筛选和写操作均经过 API 客户端；写操作成功后再拉取服务端数据。当前请求由 Playwright mock 响应，不连接真实后端。契约适配层统一通过 `requestValidated` 校验响应，使用 `If-Match` 保护更新、使用 `Idempotency-Key` 保护创建和生命周期动作，并由 HTTP 客户端附加 CSRF 与请求 ID。fixtures 不是页面数据源，也不包装成生产 API。

### 5.2 后续真实接入事项（非本轮验收）

以下能力已有前端适配实现；若后续进入真实环境阶段，再由后端 OpenAPI 3.1 冻结具体生产语义。本轮不要求完成这些联调项：

| 能力 | 必须确认 |
|---|---|
| 用户列表与详情 | 分页、排序、搜索、机构筛选、状态筛选、乐观并发版本 |
| 用户资料更新 | 单机构迁移规则、邮箱/用户名唯一性、审计事件 |
| 用户角色绑定 | 防提权、最后管理员事务、权限版本递增、失败关闭 |
| 凭证动作 | 重置凭证和强制退出的真实语义、审计与通知 |
| 角色列表与详情 | 内置模板保护、租户级自定义角色、权限目录版本 |
| 角色写入 | 权限变更校验、数据范围校验、并发版本和审计 |
| 字典类型与项 | 主从分页、唯一性、默认项事务、缓存失效语义 |
| 公告生命周期 | 状态转换、计划任务、受众计算、发布快照和历史保留 |
| 审计查询 | 稳定筛选、游标分页、时间语义、脱敏和对象级复核 |
| 授权能力 | 服务端返回的有效权限、数据范围和 `permissions_version` |

页面已补齐 loading、empty、error、conflict 和 retry 的前端呈现，并通过认证/错误归一化链路与 mock 错误场景验收。真实环境联调、双租户隔离、审计 Outbox 和事务失败不在本轮验收范围。

## 6. 无障碍与响应式设计

- 所有导航、列表选择、筛选、Modal、Drawer 和操作按钮必须可通过键盘完成。
- Drawer、Modal 保留 Escape、焦点陷阱和焦点恢复；关闭 dirty Drawer 必须确认。
- 权限矩阵复选框必须暴露完整可访问名称和组级半选状态。
- 公告受众使用 `fieldset + legend`；状态和错误使用 `role="status"` 或 `role="alert"`。
- 审计详情使用定义列表和可聚焦关联链接；脱敏值与结果状态均有文本表达。
- 五个页面在 320px 宽度下不得产生页面级横向滚动。

## 7. 文件清单

### 7.1 共享与接入

- `src/types/admin.ts`
- `src/api/shared/admin.ts`
- `src/api/{users,roles,dictionaries,announcements,audit-logs}/`
- `src/app/router/routes.ts`
- `src/app/navigation/nav.ts`
- `src/locales/zh-CN.ts`
- `src/locales/en-US.ts`

### 7.2 模块文件

```text
src/modules/users/{fixtures/users.ts,model.ts,routes.ts,index.ts,pages/UsersPage.vue}
src/modules/roles/{fixtures/roles.ts,model.ts,routes.ts,index.ts,pages/RolesPage.vue}
src/modules/dictionaries/{fixtures/dictionaries.ts,model.ts,routes.ts,index.ts,pages/DictionariesPage.vue}
src/modules/announcements/{fixtures/announcements.ts,model.ts,routes.ts,index.ts,pages/AnnouncementsPage.vue}
src/modules/audit-logs/{fixtures/audit-events.ts,model.ts,routes.ts,index.ts,pages/AuditLogsPage.vue,pages/AuditLogDetailPage.vue}
```

### 7.3 测试

- `tests/unit/admin-management-slices.spec.ts`
- `tests/e2e/production/admin-management.e2e.ts`
- `tests/e2e/production/pages.e2e.ts`
- `tests/production-accessibility/pages.accessibility.spec.ts`

## 8. 验收结果与范围边界

2026-11-19 实际执行结果：

- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run test:unit`：26 个测试文件、171 个测试通过。
- `npm run test:e2e -- tests/e2e/production/admin-management.e2e.ts tests/e2e/production/pages.e2e.ts`：13 个测试通过。
- `npm run test:e2e`：完整 28 个测试通过。
- `npm run test:accessibility`：Showcase 2 个、生产路由 3 个测试通过，无 critical/serious axe 问题。
- `npm run build`：通过；存在既有主包约 746 kB、超过 500 kB 的构建警告。
- `npm run check:theme-css`、`npm run check:tokens`：通过。

范围外事项（不影响本轮验收）：

1. 真实环境的分页、并发、幂等、审计 Outbox 和事务约束由后续联调阶段负责。
2. 页面沿用现有 `requiresAdmin`；细粒度能力返回属于后续权限接入阶段。
3. 用户、角色、字典、公告、审计与机构页面的真实 API 联调不属于本轮。
4. 搜索、筛选和排序目前在前端内存完成；大数据量分页与性能未验收。
5. 公告计划发布仅在 mock 中改变状态，不包含真实定时任务、失败重试或通知投递。

## 9. 后续可选工作（非本轮验收）

1. 用后端 OpenAPI 3.1 冻结六个管理模块的适配层与稳定错误码，不按页面反推契约。
2. 关闭服务端有效权限与数据范围返回契约，再扩展路由/按钮授权展示。
3. 如需进入真实环境阶段，按用户与角色、字典与公告、审计查询、机构事务的顺序联调。
4. 每个模块补齐 loading、empty、error、forbidden、conflict 状态以及契约测试。
5. 真实环境阶段再完成并发、审计、失败关闭、分页性能与回归测试。

## 10. 风险收敛记录（2026-11-17 至 2026-11-19）

- 修复角色仅修改名称、说明或数据范围时保存按钮仍禁用的问题，并加入元数据脏状态测试。
- 角色切换、复制、启停和新建增加未保存修改确认，避免静默丢失编辑内容。
- 最后租户管理员保护扩展到角色绑定：不能移除 `tenant_admin` 角色，也不能把其范围从 `all` 缩小；租户管理员范围选择在页面层锁定为 `all`。
- 授权、邀请和启停后重新计算最后租户管理员标记，避免静态 fixture 标记漂移。
- 修复字典默认项保护导致类型永远无法停用的死锁：存在其他活动项时先迁移默认项；最后一个活动默认项可停用并清除默认状态。
- 字典编辑表单无法再创建“停用且默认”的非法组合，并移除了 fixture 中的对应非法状态。
- 公告增加标题、正文、受众和未来时间校验；全体受众规则归一化；复制时深拷贝受众；修复本地时间与 UTC 的相互转换。
- 用户“有效权限预览”改为跟随尚未保存的角色草稿，并增加 E2E 断言。
- 公告勾选“全体用户”时保留原机构/角色草稿，取消该选项后可恢复；增加 E2E 回归断言。
- 公告与角色列表切换增加放弃确认，修复创建/复制成功消息被选择监听器清空的问题。
- 审计动作筛选补齐 `audit.log_queried`，动作标签改为中英文 i18n，日期筛选明确标注 UTC。
- 机构页从本地 fixtures 切换到 `src/api/organizations/`：递归树加载、创建、编辑、移动、启停均走 API；写操作携带版本/幂等前提，写后重新拉取树，并展示 loading、加载失败、重试和冲突错误。
- 管理端 E2E mock 补齐 CSRF Cookie、组织树与写操作端点；完整 E2E 由 23/28 提升到 28/28。
