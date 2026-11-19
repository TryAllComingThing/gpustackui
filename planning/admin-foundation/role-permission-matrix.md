# 角色权限矩阵 v0.2

- 变更 ID：`admin-foundation`
- 状态：`PROPOSED / ALL PRODUCT DECISIONS CONFIRMED`
- 日期：2026-11-15
- 关联决策：`decision-log.md`
- 重要说明：以下权限码、角色和范围均为 v0.2 提案，不是当前仓库已实现契约。当前源码只定义 `authenticated`、`admin` 和 `is_admin`。进入实现前必须由后端和安全评审确认，并同步更新 `docs/architecture/AUTH-AND-PERMISSIONS.md`、API 契约、路由守卫和测试。

## 1. 模型原则

采用：

> **多租户 RBAC 功能权限 + 四种标准机构数据范围**

- 用户 → 用户角色绑定 → 角色 → 权限集合。
- 用户角色绑定同时包含数据范围。
- 功能权限回答“能不能做这个动作”。
- 数据范围回答“能对哪些对象做这个动作”。
- 所有租户级授权计算必须包含 `tenant_id`。
- 后端对列表、总数、详情、写操作和有效权限预览独立授权。
- 前端只展示和提前禁用，不作为安全边界。
- 权限码由研发维护；管理员只能把权限分配给角色，不能自由制造权限字符串。

## 2. 权限码目录规则

格式：

```text
<domain>:<resource>:<action>
```

规则：

- 使用小写英文和冒号分隔。
- 权限码发布后保持稳定，通过迁移处理重命名。
- 显示名称和分组来自权限目录，不把中文名称写入权限码。
- 不把角色名直接作为路由权限判断条件。
- 页面内不得自由输入权限码。
- 所有 API 操作、页面动作和测试断言必须引用同一权限码。
- 未知权限码必须失败关闭。

## 3. 租户级角色责任链

| 角色键 | 名称 | 作用域 | 首期状态 | 保护规则 |
|---|---|---|---|---|
| `platform_admin` | 平台管理员 | `platform_all` | 启用 | 独立平台入口；全局至少保留一个有效用户；不可删除 |
| `tenant_admin` | 租户管理员 | 当前租户 `all` | 启用 | 每租户至少保留一个有效用户；不得跨租户或分配平台管理员 |
| `org_admin` | 机构管理员 | `org` / `org_subtree` | 启用 | 内置模板；不得授予超出自身可授予权限和范围的权限 |
| `auditor` | 审计员 | `org_subtree` 或 `all` | 启用 | 只读；首期不开放导出 |
| `read_only` | 只读管理员 | `org_subtree` | 启用 | 不包含任何写操作 |
| `standard_user` | 普通用户 | `self` | 启用 | 仅个人资料和业务自助能力，不进入管理端菜单 |

角色定义归属已确认：内置角色实例化为租户初始化模板，自定义角色只属于当前租户；`platform_admin` 是独立平台身份，不与普通租户角色共用角色分配界面。`tenant_admin` 首期启用，可在当前租户内管理组织、用户、租户级自定义角色、字典、公告和审计查询；不得访问 `/platform/*` 或切换其它租户。

## 4. 功能权限矩阵

图例：

- `PLATFORM`：仅在独立平台入口执行，范围 `platform_all`。
- `ALL`：当前租户全部范围，即 `all`，不跨租户。
- `SCOPE`：受角色绑定的机构范围限制。
- `SELF`：仅与调用者本人具有明确资源关系的对象。
- `COND`：需要附加条件、保护规则或单独授权。
- `—`：默认不允许。

| 能力/权限码 | platform_admin | tenant_admin | org_admin | auditor | read_only | standard_user |
|---|---|---|---|---|---|---|
| `profile:self:read` | — | SELF | SELF | SELF | SELF | SELF |
| `profile:self:update` | — | SELF | SELF | SELF | SELF | SELF |
| `iam:organization:read` | PLATFORM | ALL | SCOPE | SCOPE | SCOPE | — |
| `iam:organization:create` | PLATFORM | ALL | SCOPE | — | — | — |
| `iam:organization:update` | PLATFORM | ALL | SCOPE | — | — | — |
| `iam:organization:move` | PLATFORM | ALL | — | — | — | — |
| `iam:organization:update-status` | PLATFORM | ALL | — | — | — | — |
| `iam:organization:delete` | — | — | — | — | — | — |
| `iam:user:read` | PLATFORM | ALL | SCOPE | SCOPE | SCOPE | — |
| `iam:user:create` | PLATFORM | ALL | SCOPE | — | — | — |
| `iam:user:update` | PLATFORM | ALL | SCOPE | — | — | — |
| `iam:user:update-status` | PLATFORM | ALL | SCOPE | — | — | — |
| `iam:user:reset-credentials` | PLATFORM | ALL | COND | — | — | — |
| `iam:user:change-organization` | PLATFORM | ALL | SCOPE | — | — | — |
| `iam:user:assign-role` | PLATFORM | ALL COND | SCOPE COND | — | — | — |
| `iam:user:view-effective-permissions` | PLATFORM | ALL | SCOPE | SCOPE | — | SELF |
| `iam:role:read` | PLATFORM | ALL | SCOPE | SCOPE | SCOPE | — |
| `iam:role:create` | PLATFORM | ALL | — | — | — | — |
| `iam:role:update` | PLATFORM | ALL | — | — | — | — |
| `iam:role:update-status` | PLATFORM | ALL | — | — | — | — |
| `iam:permission:read` | PLATFORM | ALL | SCOPE | SCOPE | SCOPE | — |
| `system:dictionary:read` | PLATFORM | ALL | ALL | ALL | ALL | ALL |
| `system:dictionary:create` | PLATFORM | ALL | — | — | — | — |
| `system:dictionary:update` | PLATFORM | ALL | — | — | — | — |
| `system:dictionary:update-status` | PLATFORM | ALL | — | — | — | — |
| `content:announcement:read` | PLATFORM | ALL | SCOPE | SCOPE | SCOPE | SCOPE |
| `content:announcement:create` | PLATFORM | ALL | SCOPE | — | — | — |
| `content:announcement:update` | PLATFORM | ALL | SCOPE | — | — | — |
| `content:announcement:publish` | PLATFORM | ALL | SCOPE COND | — | — | — |
| `content:announcement:withdraw` | PLATFORM | ALL | SCOPE COND | — | — | — |
| `audit:log:read` | PLATFORM | ALL | — | SCOPE | — | — |
| `audit:log:detail` | PLATFORM | ALL | — | SCOPE | — | — |
| `audit:log:export` | — | — | — | — | — | — |
| `platform:tenant:manage` | COND | — | — | — | — | — |

说明：

- `tenant_admin` 首期启用；权限、数据范围和最后管理员保护均限定在当前租户。
- `platform:tenant:manage` 只存在于独立平台入口，不允许普通租户 API 接受客户端切换租户。
- 启用和停用统一使用 `*:update-status`；不得同时保留 `enable`、`disable` 两个语义重叠权限。
- 个人资料使用 `profile:self:*`，不与管理端 `iam:user:*` 混用。
- `iam:role:assign` 被删除；角色分配统一使用 `iam:user:assign-role`，避免同一动作出现两个权限码。
- 机构首期只支持停用与启用，不提供删除或恢复；`iam:organization:delete` 为后置保留权限，不得出现在首期 API、路由或按钮中。
- 审计首期仅支持保存和授权范围内查询；不提供 `audit:log:export`、归档或合规删除能力。

`COND` 规则：

- `tenant_admin` 和 `org_admin` 只能分配“可授予角色集合”中的角色，且不得超出自身权限和范围。
- `org_admin` 不能授予平台管理员、租户管理员、审计员或包含未授权权限的派生角色。
- 密码重置、角色分配、公告发布与撤回的最终策略仍须后端安全签批；签批前使用下方安全默认候选。
- `auditor` 首期只读和查询审计日志，不开放导出。
- `platform_admin` 跨租户管理必须使用独立平台接口；普通 API 不因该角色自动绕过租户约束。

### 4.1 `COND` 安全默认候选（待安全/后端签批）

以下默认值用于避免实现期自由解释，状态为 `PROPOSED_SECURE_DEFAULT`，不替代安全签批：

| 动作 | 安全默认 | 理由 |
|---|---|---|
| `org_admin` 重置密码/凭证 | 禁止；仅 `tenant_admin` 或平台管理能力可执行 | 凭证重置影响账号接管和全局安全 |
| `org_admin` 分配角色 | 仅可分配 `standard_user`、`read_only` 及明确标记为可授予给 `org_admin` 的自定义角色；权限和范围必须是其可授予集合子集 | 保留机构管理能力，同时禁止授予审计员、租户管理员或平台身份 |
| `org_admin` 公告发布/撤回 | 禁止；可创建和编辑草稿，由 `tenant_admin` 发布或撤回 | 公告面向范围可能超出机构子树，发布影响不可局部撤销 |
| `tenant_admin` 分配 `tenant_admin` | 允许在同一租户内增补管理员，但不得移除最后一个有效 `tenant_admin`；操作必须审计 | 支持租户自助延续，同时由最后管理员不变量保护 |
| `tenant_admin` 分配平台身份 | 禁止 | 平台身份只能由独立 `/platform/*` 能力管理 |
| 自定义角色可授予标记 | 权限目录新增 `delegable` 或等价元数据，默认 `false` | 不能从 UI 可编辑性或角色名推断可委派性 |

## 5. 数据范围模型

| 范围类型 | 判定规则 | 允许使用的典型能力 |
|---|---|---|
| `self` | 目标资源具有显式 `subject_user_id = actor.user_id` 关系；具体关系由 API Schema 定义 | 个人资料、本人有效权限 |
| `org` | `target.tenant_id = actor.tenant_id AND target.organization_id = binding.organization_id` | 机构、用户、机构公告 |
| `org_subtree` | 目标机构位于绑定机构的闭包子树中，包含绑定机构本身 | 机构管理员、用户管理、公告受众 |
| `all` | `target.tenant_id = actor.tenant_id` | 当前租户管理 |

- 首期只有 `self`、`org`、`org_subtree`、`all` 四种标准租户数据范围；`custom` 明确延后，不进入首期 Schema、权限矩阵或页面。
- `all` 永远不跨租户；`platform_all` 不是普通租户数据范围，只能用于独立平台入口和平台权限，不能用于普通租户路由。
- `self` 不得解释为“本人创建的任意对象”，除非具体 API 明确声明该资源关系。
- 多个绑定按“逐绑定判定动作 + 对象范围”，功能权限取并集，不能把范围错误地取最大。
- 禁止在客户端合并范围或提交 `scope=all/platform_all` 扩大权限。

## 6. 角色绑定与范围 Schema

建议 `UserRoleBinding`：

```text
id: opaque string
tenant_id: opaque string
user_id: opaque string
role_id: opaque string
scope_type: self | org | org_subtree | all
organization_id: opaque string | null
granted_by: opaque string
granted_at: ISO-8601
expires_at: ISO-8601 | null
```

约束：

- `scope_type = org | org_subtree` 时必须提供 `organization_id`。
- `scope_type = self | all` 时 `organization_id = null`。
- 所有绑定必须包含 `tenant_id`。
- `platform_admin` 不得通过普通租户内 `UserRoleBinding` 表达。跨租户操作只能使用独立 `/platform/*` 能力；平台身份载体、目标租户记录和平台审计字段仍须后端与安全技术签批。
- 同一用户可有多个角色绑定，不同绑定可有不同范围。
- 角色停用或删除不得静默扩大权限；已有绑定必须失效、迁移或阻断删除。
- 管理员不能授予自己或他人超过自身可授予权限和范围的绑定。

`custom` 范围明细模型明确后置，不属于首期 `UserRoleBinding` Schema。首期不得实现半成品 `custom` 编辑器、自由范围表达式或隐藏的资源白名单字段。

## 7. 有效权限算法

后端按以下顺序计算和校验：

1. 从已验证会话取得 `actor_id` 和 `tenant_id`。
2. 忽略已过期、已撤销或租户不匹配的角色绑定。
3. 对每个有效绑定读取角色权限集合和绑定范围。
4. 对每个绑定读取角色权限集合，不得从范围、角色名或页面状态推增权限。
5. 对具体动作和对象，逐绑定判断“动作 ∈ role.permissions + 对象在范围内 + 租户匹配”。
6. 任一绑定允许该动作和目标对象，则允许；否则进入错误映射。
7. 列表查询将范围转换为服务端查询条件，`total` 只统计授权范围内数据。
8. 前端可展示“动作 → 来源角色 → 范围摘要”，但最终结果必须由后端返回或校验。
9. 角色、绑定、用户机构、机构层级或用户状态变化时，递增受影响用户的 `permissions_version`。
10. 权限缓存失效或授权服务异常时失败关闭。

可执行判定式：

```text
effective_action(actor, action, object)
  = OR over active bindings [
      action ∈ role.permissions
      AND object ∈ binding.scope
      AND actor.tenant_id = object.tenant_id
    ]

grantable_permissions(actor)
  = actor.effective_permissions filtered by explicit delegation capability
```

`grantable_permissions` 必须由后端权限目录显式标注可委派性，不能从角色名或 UI 可编辑性推断。

## 8. 强制授权断言

### 8.1 `assertCanManageUser(actor, targetUser, action)`

必须检查：

- `actor.tenant_id = targetUser.tenant_id`，平台入口除外且必须有 `platform_all`。
- 目标用户位于调用者的有效范围。
- 调用者拥有对应 `iam:user:*` 权限。
- 操作不会让调用者获得超出自身可授予权限包的能力。
- 对最後管理员、受保护角色和当前登录用户的自我提权执行专项拒绝。
- 重置凭证、启停、调岗和角色变更分别走对应专项断言。

### 8.2 `assertCanGrantRole(actor, targetUser, role, scope)`

必须检查：

- 角色和绑定属于同一 `tenant_id`。
- 角色处于可分配状态。
- 角色权限集合是调用者“可授予权限包”的子集。
- 目标范围是调用者可授权范围的子集。
- `platform_admin` 不得由任何租户角色分配；`tenant_admin` 只能由同租户 `tenant_admin` 或平台能力分配，且必须满足最后管理员不变量；`org_admin` 不得分配 `tenant_admin` 或其它受保护角色。
- 禁止自我提权、授予过期角色、通过派生角色绕过权限包。

提交前必须证明：

```text
candidate.role.permissions ⊆ actor.grantable_permissions

candidate.scope.objects
  ⊆ actor.grantable_scope

actor has iam:user:assign-role for target user
```

任一断言失败必须失败关闭；前端提示不能代替后端拒绝。

### 8.3 `assertCanMoveOrganization(actor, source, targetParent)`

必须检查：

- 调用者拥有 `iam:organization:move`。
- 源机构和目标父机构属于同一租户，且都位于调用者可写范围。
- 源机构不是根节点；目标父机构处于 `active`。
- 目标父机构不是源机构自身或其后代。
- 移动后的整棵子树不超过 4 级。
- 事务内锁定租户机构结构保护记录、源子树和目标父机构，防止并发移动产生环。
- 移动、停用、启用或机构引用变化后，受影响用户集合至少为：主属机构位于源子树的用户、角色绑定范围为源机构/源子树/后代的用户；必须原子递增其 `permissions_version` 并写入审计 Outbox。

## 9. 最后管理员并发不变量

### 9.1 全局平台管理员

- `platform_admin` 是全局平台角色。
- 停用、删除、移除角色或撤销 Session 时，必须在事务中确认至少保留一个有效 `platform_admin`。
- 并发请求必须通过租户无关的全局保护行、可串行化事务或等价机制串行化。

### 9.2 租户管理员

- 每个启用租户必须至少保留一个有效 `tenant_admin`。
- 保护作用域为 `tenant_id`；不同租户可并行，但同一租户内的保护检查必须原子。
- Outbox、角色变更、用户状态和审计必须同一事务提交。
- 角色绑定到期、用户离职同步、身份解绑和批量撤销也必须经过同一保护断言；不得通过异步过期任务绕过最后管理员检查。

不得采用：

- 修改前单独 `SELECT count(*)`。
- 前端禁用按钮作为保护。
- 仅依赖唯一约束而不处理删除或角色移除。
- 检查失败后继续提交其它授权变更。

## 10. 统一错误与空列表语义

| 场景 | 结果 |
|---|---|
| 未认证或 Session 版本失效 | `401`，清理本地状态并回登录 |
| 已认证但缺功能权限 | `403`，禁止访问；不返回对象数据 |
| 有功能权限，但对象不存在或在范围外 | `404`，避免枚举 |
| 有功能权限，列表范围内无数据 | `200` 空列表，`total = 0` |
| 缺 `If-Match` | `428` |
| `If-Match` 版本过期 | `412` |
| 重复编码、非法移动、最后管理员、状态冲突 | `409` 或明确的业务冲突错误 |
| 网络/超时/服务异常 | 页面不可用或重试，不降级授权 |

禁止用 `403` 返回范围外对象详情，也禁止用空列表掩盖缺少功能权限。

## 11. 菜单、路由与前端消费契约

正确：

```text
permission = 'iam:organization:read'
permission = 'iam:organization:update'
permission = 'iam:user:assign-role'
```

错误：

```text
requiredRole = 'org_admin'
```

权限契约确认后，路由元数据建议扩展为：

```ts
meta: {
  requiresAuth: true,
  permissions: ['iam:organization:read'],
  permissionMode: 'all', // all | any；默认 all
}
```

当前只支持 `authenticated` 和 `admin`。扩展 `AuthPermission`、`route-meta.d.ts`、guard 和菜单可见性属于 L3 变更，必须单独评审。

菜单规则：

- 无读权限的菜单不展示。
- 有读权限、无写权限时页面可见，写按钮隐藏或禁用。
- 菜单隐藏不能替代路由 guard，路由 guard 不能替代后端授权。
- 前端不得从角色名推断权限；只能消费后端能力或已确认权限码。

## 12. 权限变更刷新语义

必须递增 `permissions_version` 的写操作：

- 创建、修改、停用或重新启用角色权限集合。
- 创建、修改或撤销用户角色绑定。
- 修改用户所属机构。
- 移动机构子树。
- 修改用户状态。
- 修改影响角色可授予性的保护配置。

必须递增 `session_version` 的操作：

- 用户停用。
- 密码重置或强制改密。
- 身份绑定解除。
- 安全事件强制退出。
- 管理员撤销目标用户全部 Session。
- 破窗账号紧急禁用。

## 13. 验收矩阵

| 场景 | 预期 |
|---|---|
| 平台管理员从独立平台入口访问租户管理能力 | 按 `platform_all` 和平台权限允许 |
| 平台管理员通过普通租户参数切换租户 | 拒绝，普通 API 不信任客户端 `tenant_id` |
| 租户管理员访问其它租户数据 | `404` 或严格拒绝，禁止返回数据或全量计数 |
| 机构管理员访问本机构子树用户 | 允许 |
| 机构管理员访问兄弟机构用户详情 | `404`，列表不包含该对象 |
| 机构管理员授予平台管理员 | 拒绝并审计 |
| 机构管理员授予超出自身权限的派生角色 | 拒绝 |
| 审计员修改用户或公告 | 拒绝 |
| 只读管理员创建公告 | 拒绝 |
| 普通用户读取或更新个人资料 | 仅 `profile:self:*` 允许 |
| 普通用户调用管理端 `iam:user:*` | 拒绝 |
| `self` 范围访问本人创建但资源关系未声明的对象 | 拒绝 |
| 无读权限访问列表 | `403` |
| 有读权限但范围内无数据 | `200` 空列表，`total = 0` |
| 角色权限被移除后已登录用户继续写操作 | 旧权限按 `permissions_version` 及时失效 |
| 两个请求并发移除最后平台管理员 | 一个成功，另一个被原子保护拒绝 |
| 两个请求并发移除同一租户最后 `tenant_admin` | 一个成功，另一个被原子保护拒绝 |
| 两租户并发操作最后管理员 | 租户级保护互不阻塞，但均不得降为 0 |
| 机构移动到自身或后代 | `409`，不得产生环 |
| 机构移动导致子树超过 4 级 | `409`，不得部分提交 |
| 缺 `If-Match` / 版本过期 | 分别返回 `428` / `412` |
| 范围外详情与计数 | 全部使用同一数据范围约束 |
