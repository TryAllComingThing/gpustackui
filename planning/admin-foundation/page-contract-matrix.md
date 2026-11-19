# 管理平台页面契约矩阵 v0.2

- 变更 ID：`admin-foundation`
- 状态：`PROPOSED / FRONTEND ADMIN SLICES IMPLEMENTED`
- 评审状态：`ALL PRODUCT DECISIONS CONFIRMED / FRONTEND LOCAL SLICES IMPLEMENTED / REAL API GATES PENDING`
- 开发授权：`FRONTEND LOCAL FIXTURES ALLOWED / REAL API AND BACKEND AUTHORIZATION PENDING`
- 日期：2026-11-16
- 关联文档：`interaction-and-reference.md`、`role-permission-matrix.md`、`capability-map.md`、`review-report-2026-11-14-r3.md`

> 本文件把页面入口、权限、数据范围、API、状态责任和原型门禁收束为一张可追踪矩阵。它不是路由实现授权。`TBD` 表示尚无可确认契约，不得由前端猜测或使用 fixture 冒充。

## 1. 页面契约字段

每个页面在形成独立 L3 任务前必须填写：

```text
page_id
route_name
path
nav.parentKey
breadcrumb_key
page_title_i18n_key
read_permission
action_permissions[]
data_scope
api_contract_status
state_owner
high_fidelity_gate
accessibility_acceptance
```

规则：

- `route_name`、`nav.parentKey` 和 i18n key 必须在实现前完成唯一注册并增加冲突测试。
- 读权限只控制页面入口；每个写动作仍需独立权限和数据范围判断。
- `data_scope` 由后端计算，页面不得通过参数、角色名或前端缓存扩大范围。
- API 未冻结时只允许 HTML 原型和静态状态设计，不允许创建 `src/api/` 请求函数。
- 页面状态归页面所有者维护；全局 `401` 归会话层，导航可见性归授权展示层。

## 2. 页面矩阵

| page_id | 页面 | 规划路径 | route_name | nav.parentKey | 读权限 | 主要动作权限 | 数据范围 | API 契约 | HTML 原型门禁 |
|---|---|---|---|---|---|---|---|---|---|
| `ADMIN-OVERVIEW` | 管理概览 | `/` | `admin-overview` | `workspace` | `authenticated`（访问对象待产品确认） | — | 当前会话租户 | 当前 `/api/users/me` 可确认会话；概览聚合 API `TBD` | 能力评审；不要求复杂 HTML 原型 |
| `IAM-ORG-LIST` | 机构管理 | `/system/organizations` | `iam-organization-list` | `iam` | `iam:organization:read` | `create/update/move/update-status` | `org` / `org_subtree` / `all` | `organization-api-contract-v0.2.md` + OpenAPI 提案；`NOT FREEZABLE` | `HTML-P0` |
| `IAM-USER-LIST` | 用户管理 | `/system/users` | `iam-user-list` | `iam` | `iam:user:read` | `create/update/update-status/change-organization/assign-role` | `org` / `org_subtree` / `all` | 用户 API `TBD` | `HTML-P1`；Drawer 标准模式评审 |
| `IAM-ROLE-LIST` | 角色管理 | `/system/roles` | `iam-role-list` | `iam` | `iam:role:read` | `create/update/update-status` | 读 `org` / `org_subtree` / `all`；角色定义写操作仅当前租户 `all` | 角色 API `TBD` | `HTML-P0`；权限矩阵技术评审 |
| `SYS-DICT-TYPE` | 数据字典 | `/system/dictionaries` | `system-dictionary-list` | `settings` | `system:dictionary:read` | `create/update/update-status` | 当前租户 `all` | 字典 API `TBD` | `HTML-P1` |
| `CONTENT-ANN-LIST` | 公告管理 | `/content/announcements` | `content-announcement-list` | `content` | `content:announcement:read` | `create/update/publish/withdraw` | `org` / `org_subtree` / `all` | 公告 API `TBD` | `HTML-P0`；已发布内容不可原地修改 |
| `AUDIT-LOG-LIST` | 审计日志 | `/audit/logs` | `audit-log-list` | `security` | `audit:log:read` | —（首期不导出） | `org_subtree` / `all` | 审计 API `TBD` | `HTML-P0`；仅保存与查询 |
| `AUDIT-LOG-DETAIL` | 审计详情 | `/audit/logs/:eventId` | `audit-log-detail` | `security` | `audit:log:detail` | — | 与列表相同并逐对象复核 | 审计详情 API `TBD` | `HTML-P0` |
| `ACCOUNT-PROFILE` | 个人资料 | `/account/profile` | `account-profile` | `account` | `profile:self:read` | `profile:self:update` | `self` | 当前个人资料能力需与真实 Auth API 对齐 | 标准模式评审 |

### 2.1 管理概览访问对象

`ADMIN-OVERVIEW` 目前仍写为 `authenticated`，因此无法判断普通用户是否应进入管理概览。实现前必须由产品确认其一：

1. 所有已认证用户都能进入，概览只显示个人和公告能力。
2. 只有拥有任一管理读权限的用户能进入，普通用户跳转个人中心。
3. 概览拆分为管理员概览和普通用户首页两个页面。

该问题在本轮不自行关闭。

### 2.2 租户自助管理边界

`tenant_admin` 使用 `/system/organizations`、`/system/users`、`/system/roles`、`/system/dictionaries`、`/content/announcements` 和 `/audit/*`，数据范围固定为当前租户 `all`。页面不得提供租户切换器、`/platform/*` 入口、平台管理员分配、租户创建或租户删除。租户自助管理不新造独立页面树，先复用上述页面和页面 ID。

## 3. 页面状态与动作责任

| 页面类别 | 页面所有者 | 空状态 | 筛选无结果 | 403 / 404 | 业务冲突 | 动作成功 |
|---|---|---|---|---|---|---|
| 机构树 | 机构模块 | 当前范围无机构 | 保留筛选并提供重置 | 统一不可用，不泄露范围外对象 | 按稳定错误码恢复 | 局部刷新受影响子树 |
| 用户列表 | 用户模块 | 当前范围无用户 | 保留筛选 | 不展示对象 | 按角色、范围、状态错误恢复 | Drawer 关闭或保留并提示 |
| 权限矩阵 | 角色模块 | 无权限目录 | 无可分配权限 | 禁止进入或只读 | 防提权、版本冲突分开处理 | 展示变更摘要并要求刷新授权 |
| 公告 | 内容模块 | 无公告 | 保留筛选 | 草稿不可越权查看 | 状态、版本和幂等冲突分开处理 | 保留发布结果和审计引用 |
| 审计 | 审计模块 | 当前范围无事件 | 保留筛选 | 不展示范围外事件 | 仅展示查询与保存边界，不提供导出或删除 | 展示 `request_id` 和查询结果 |

`401` 统一由会话层处理。`412` 版本过期、`428` 缺前置条件、`429` 限流和 `5xx` 服务异常必须独立呈现，不得合并为普通 `409`。

## 4. 复杂页面可访问性验收

### 4.1 机构树

- 展开/收起、节点选择和移动对话框均可只用键盘完成。
- 支持方向键、Home/End、Enter/Space，并提供当前节点和祖先路径的可访问名称。
- 拖拽只是增强；无拖拽路径必须完成全部业务动作。
- 对话框关闭或操作成功后焦点回到触发节点；节点失效时回到最近可见祖先。
- 320px 宽度无页面级横向滚动。

### 4.2 用户 Drawer

- 打开后焦点进入标题或首个可编辑字段；Escape、关闭按钮和遮罩行为一致。
- 资料区与授权区分别保存；任一区域 dirty 时离开必须确认。
- 保存失败聚焦错误摘要或首个错误字段；成功后焦点可预测。
- 权限摘要不只依赖颜色，提供文本和可访问描述。

### 4.3 权限矩阵

- 每个复选框有完整可访问名称，至少包含角色、资源、动作和范围。
- 组级 checkbox 暴露 `mixed` 状态并播报变化。
- 受保护、只读和不可授予原因通过可见文本与 `aria-describedby` 关联。
- 支持仅看变更、受保护和可授予筛选；键盘可完成组选择与保存。
- 窄屏按资源分组为手风琴或分步编辑，不压缩为不可操作表格。

### 4.4 公告与审计

- 公告发布、撤回、失败和过期状态使用 live region 播报。
- 审计详情支持深链接、复制 `request_id` 和关联事件筛选。
- 错误、状态、危险动作和差异不能只用颜色表达。

## 5. 原型与证据门禁

| 页面 | HTML 基础原型 | HTML 复杂场景原型 | 评审方式 |
|---|---|---|---|
| 机构树 | 树、筛选、创建、移动、启停、空/错状态 | 桌面/窄屏、键盘焦点、移动确认、冲突状态 | HTML 原型 + 实现评审 |
| 用户 Drawer | 资料/授权/凭证分区，dirty 和错误摘要 | 标准模式评审；窄屏分区 | HTML 原型 + 实现评审 |
| 权限矩阵 | 分组、受保护、防提权、变更摘要 | 桌面/窄屏、indeterminate、键盘保存 | HTML 原型 + 实现评审 |
| 公告 | 状态机、预览快照、受众和撤回 | 发布/撤回答疑、失败和过期 | HTML 原型 + 实现评审 |
| 审计 | 筛选、详情、仅保存边界 | 深链接、脱敏、错误和空状态 | HTML 原型 + 实现评审 |

原型工具已确认采用 HTML；不额外要求多角色签收、版本号或证据包。实现仍须通过代码级键盘、窄屏和可访问性验收。

## 6. 组件复用决策

| 页面能力 | 首选 | 结论 | 前置条件 |
|---|---|---|---|
| 平面列表 | `DataTablePattern + UDataTable` | REUSE | 复用现有分页、筛选和空状态 |
| 标准表单 | `ComplexFormPattern` | REUSE | 不复制 Nuxt UI 原语 |
| 机构层级 | `UTable` 展开行组合或 `UTree` + 详情区 | EXTEND / 页面私有 | 首期页面私有；出现第二个真实复用后再评估公共树表 |
| 用户 Drawer | `UDrawer + UForm` 分区 | EXTEND | 独立提交、dirty 和焦点恢复契约 |
| 权限矩阵 | 页面私有组合 | NEW | 必须先完成无原型门禁和可访问性验收 |
| 公告预览/审计详情 | 页面私有组合 | NEW | 不得进入生产路由前使用后端真实能力 |

所有新增或扩展组件前必须执行 `npm run reuse:search -- <能力关键词>`，并在独立实现任务中记录 REUSE / EXTEND / NEW 结论。

## 7. 决策落位与剩余技术门禁

| 决策 | 对页面契约的影响 |
|---|---|
| 后端 OpenAPI | 本轮以草案适配层和 mock 验收；进入真实环境阶段时再冻结字段、错误、版本、幂等和审计 |
| 技术签批 | 后端、安全、运维和前端完成权限、租户隔离、最后管理员和实现方案签批 |
| 设计验收 | 采用 HTML 原型；实现后完成键盘、窄屏、状态矩阵和可访问性测试 |

已确认落位：`MANUAL-03` 仅受控内网 + MFA；`MANUAL-04` 开发租户自助管理和 `tenant_admin`；`MANUAL-05` 使用独立 `/platform/*`；`MANUAL-06` 内置模板实例化、自定义角色租户级；`MANUAL-07` 只启用四种标准数据范围；`MANUAL-08` 首期只停用；`MANUAL-09` 首期仅保存；`MANUAL-10` 受众可组合且已发布不可原地修改；`MANUAL-11` 首期页面私有；`MANUAL-12` 原型采用 HTML。

此外，`ADMIN-OVERVIEW` 的访问对象、稳定错误码全集、组件可访问名称模板和后端 API 契约仍需相关负责人在实现前确认。

## 8. 前端本地实现落位

用户、角色、数据字典、公告和审计五个页面已按模块切片实现，路由、导航、中英文 i18n、单元测试、生产 E2E 与可访问性路由均已同步。页面通过对应 `src/api/<domain>/` 草案契约适配层加载和提交数据，fixtures 仅作为 E2E mock 种子；本轮已按“前端契约适配 + mock 集成”验收，真实环境联调不在范围内。详细需求、状态模型、文件清单和范围边界见 `frontend-admin-slices.md`。

页面入口当前使用既有 `requiresAuth + requiresAdmin`。矩阵中的细粒度读权限和动作权限仍是未来服务端契约输入，尚未扩展为 `AuthPermission`，也不得把页面按钮隐藏视为授权边界。
