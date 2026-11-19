# 机构 API 契约 v0.2（提案）

- 变更 ID：`admin-foundation`
- 状态：`PROPOSED / CONTRACT CANDIDATE / ALL PRODUCT DECISIONS CONFIRMED`
- 冻结状态：`NOT FREEZABLE / BACKEND OPENAPI REQUIRED`
- 日期：2026-11-15
- 关联文档：`adr-001-identity-tenant-organization.md`、`role-permission-matrix.md`、`interaction-and-reference.md`、`organization.openapi.yaml`
- 适用范围：机构树、机构基础资料、机构移动和机构状态管理

> **重要说明：当前仓库没有已实现的机构 API。** 本文和 OpenAPI 是后端联合评审提案，不是当前后端事实，也不是可立即接入 `src/api/` 的请求函数。只有后端确认并提供真实 OpenAPI 或等价 Schema 后，才能进入接口实现。本文不包含 TypeScript 请求实现。

## 1. 目标与非目标

### 目标

- 定义机构域最小读模型和写操作集合。
- 冻结租户、单根、四级、状态、编码、并发、幂等和审计语义。
- 为后端 OpenAPI、前端 Zod Schema、页面 HTML 原型和契约测试提供共同基线。
- 保证树、列表、详情、计数、移动和状态变化使用同一数据范围。

### 非目标

- 不定义用户、角色、字典、公告和审计查询 API。
- 不定义数据导入、异步批处理、审批流或 SCIM。
- 不决定数据库表结构、ORM、缓存实现或具体 IdP 产品。
- 不定义机构删除或恢复接口；首期只支持停用与启用。
- 不定义平台跨租户入口；平台跨租户操作只通过独立 `/platform/*` 能力，不进入本契约。
- 不允许前端用 fixture 模拟写操作并宣称为真实接口。

## 2. 通用约定

| 项目 | v0.2 提案 |
|---|---|
| API 基础地址 | `VITE_API_BASE_URL`，默认 `/api`（非版本化命名空间） |
| 资源路径 | `/organizations` |
| 数据格式 | `application/json; charset=utf-8` |
| 字段命名 | wire JSON 使用 `snake_case`；前端按现有 Schema 映射 |
| 租户上下文 | 服务端从已验证 Session 或受信网关注入；普通 API 不接受客户端选择 `tenant_id` |
| ID | 不透明字符串；前端不得解析、拼接或假设 UUID/自增 |
| 时间 | ISO 8601 UTC 字符串，例如 `2026-11-14T08:30:00Z` |
| 认证 | HttpOnly Session Cookie；所有接口要求已认证 |
| CSRF | `POST`、`PATCH` 必须携带现有 CSRF Header |
| 请求追踪 | 客户端发送 `X-Request-Id`；服务端在响应和错误中回传 |
| 并发控制 | 可变资源返回 `version` 和 `ETag`；写操作要求 `If-Match` |
| 幂等 | `POST` 创建、移动和状态变更要求 `Idempotency-Key` |
| 数据范围 | 服务端根据 Session、角色绑定和 `tenant_id` 过滤；客户端不得提交范围扩大参数 |

### 2.1 时间、状态和编码

- `status` 枚举：`active`、`inactive`；不使用 `disabled` 或布尔值。
- `type` 首期为受控枚举：`company`、`department`、`team`、`other`；后续字典化需独立迁移。
- `code` 创建后不可修改。
- `code_normalized` 为服务端派生字段，不在响应中暴露；规则为 Unicode `NFKC`、去除首尾空白并转换为小写。
- 唯一约束为 `(tenant_id, code_normalized)`。
- `code` 只允许稳定可读字符；具体字符集、长度和保留字由后端在 OpenAPI 中补充。
- `sort_order` 为同级排序值，数值越小越靠前；相同值使用 `created_at, id` 作为稳定第二排序键。

### 2.2 HTTP Header

请求 Header：

```text
Cookie: <HttpOnly Session>
X-CSRF-Token: <required for state-changing requests>
X-Request-Id: <client-generated id>
Idempotency-Key: <required for POST create/move/status>
If-Match: "<version>"
```

响应 Header：

```text
ETag: "<version>"
X-Request-Id: <same or server-generated id>
Location: /api/organizations/{id}   # 仅创建响应
```

### 2.3 响应与错误外壳

成功响应直接返回资源或分页对象，沿用当前 HTTP `Result<T>` 包装，不在 wire body 再套业务信封。

错误响应：

```json
{
  "code": "ORG_VERSION_CONFLICT",
  "message": "Organization was modified by another request",
  "details": {
    "organization_id": "org_01",
    "current_version": 8
  },
  "request_id": "req_01"
}
```

- 业务错误码放在 `code`；前端不得解析 `message` 做分支。
- `message` 不得包含敏感信息；UI 使用 i18n 映射。
- 错误详情只包含排障所需字段，不回传堆栈。

## 3. 端点提案

| 方法 | 路径 | 用途 | 功能权限 | 数据范围与约束 |
|---|---|---|---|---|
| `GET` | `/organizations/tree` | 获取授权范围内机构树 | `iam:organization:read` | 只返回可见节点；最大深度 4；不跨租户 |
| `GET` | `/organizations` | 分页获取扁平机构列表 | `iam:organization:read` | 搜索结果、`total` 与树使用同一范围 |
| `GET` | `/organizations/{organization_id}` | 获取单个机构 | `iam:organization:read` | 不存在或范围外返回 `404` |
| `POST` | `/organizations` | 创建非根机构 | `iam:organization:create` | 父节点必须存在、启用且可写；不创建第二个根 |
| `PATCH` | `/organizations/{organization_id}` | 修改基础资料 | `iam:organization:update` | 不修改层级、状态、编码或租户 |
| `POST` | `/organizations/{organization_id}/move` | 移动机构子树 | `iam:organization:move` | 事务锁、循环检测、四级限制、权限版本递增 |
| `POST` | `/organizations/{organization_id}/status` | 启用或停用机构 | `iam:organization:update-status` | 同一权限统一处理 `active/inactive`；不级联 |
| 删除接口 | 不提供 | 删除或恢复机构 | — | **OUT**；首期只停用与启用，不创建权限、路由或请求函数 |
| 平台接口 | `/platform/...` | 跨租户管理 | `platform_all` | **不在本契约定义**；已确认使用独立平台入口，普通租户 API 不接受请求头切换 |

## 4. 领域模型

### 4.1 `Organization`

```json
{
  "tenant_id": "tenant_01",
  "id": "org_01",
  "code": "RND",
  "name": "研发中心",
  "type": "department",
  "status": "active",
  "parent_id": null,
  "sort_order": 10,
  "leader_user_id": null,
  "description": "研发组织",
  "depth": 1,
  "version": 3,
  "created_at": "2026-11-01T08:00:00Z",
  "updated_at": "2026-11-14T08:30:00Z",
  "inactive_at": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `tenant_id` | opaque string | 是 | 只读租户边界；由服务端注入 |
| `id` | opaque string | 是 | 不透明资源 ID，不可变 |
| `code` | string | 是 | 创建后不可变；展示编码 |
| `name` | string | 是 | 去除首尾空白后非空 |
| `type` | enum | 是 | `company/department/team/other` |
| `status` | enum | 是 | `active/inactive` |
| `parent_id` | opaque string \| null | 是 | 根节点为 `null` |
| `sort_order` | integer | 是 | 同级排序值 |
| `leader_user_id` | opaque string \| null | 是 | 负责人；必须属于目标范围或由后端明确允许 |
| `description` | string \| null | 是 | 长度上限待后端补充 |
| `depth` | integer | 是 | 根为 1，最大为 4 |
| `version` | integer | 是 | 乐观锁版本，每次成功写入递增 |
| `created_at` | string | 是 | 创建时间 |
| `updated_at` | string | 是 | 最后更新时间 |
| `inactive_at` | string \| null | 是 | 停用时间；启用后是否清空由后端明确 |

`OrganizationTreeNode` 在 `Organization` 基础上增加：

```json
{
  "children": []
}
```

扁平列表节点不得包含 `children`，避免列表和树 Schema 混淆。

### 4.2 机构树响应

`GET /organizations/tree`

查询参数：

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `root_id` | opaque string | 无 | 从指定可见节点开始；不存在或不可见返回 `404` |
| `include_inactive` | boolean | `false` | 是否包含停用节点；仍受范围限制 |
| `max_depth` | integer | `4` | 相对 `root_id` 计算；`root_id` 为空时相对租户根节点，允许 `1..4` |
| `keyword` | string | 无 | 匹配节点及其必要祖先，不返回范围外节点 |

响应示例：

```json
{
  "items": [
    {
      "tenant_id": "tenant_01",
      "id": "org_01",
      "code": "HQ",
      "name": "集团总部",
      "type": "company",
      "status": "active",
      "parent_id": null,
      "sort_order": 10,
      "leader_user_id": null,
      "description": null,
      "depth": 1,
      "version": 5,
      "created_at": "2026-11-01T08:00:00Z",
      "updated_at": "2026-11-14T08:30:00Z",
      "inactive_at": null,
      "children": []
    }
  ],
  "meta": {
    "root_id": null,
    "include_inactive": false,
    "max_depth": 4,
    "truncated": false
  }
}
```

`truncated = true` 表示达到深度或服务端节点上限，前端必须提示继续筛选，不能假装是完整树。

### 4.3 扁平列表响应

`GET /organizations`

查询参数：

| 参数 | 类型 | 说明 |
|---|---|---|
| `page` | integer | 默认 1 |
| `per_page` | integer | 默认由后端决定，最大 100 |
| `search` | string | 匹配编码或名称；规则由后端文档确认 |
| `parent_id` | opaque string | 直接父节点过滤 |
| `status` | enum | `active/inactive` |
| `type` | enum | 机构类型 |
| `sort_by` | string | 白名单：`code`、`name`、`sort_order`、`created_at`、`updated_at` |
| `sort_order` | enum | `asc/desc` |

响应示例：

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 0,
    "total_pages": 0
  }
}
```

`total` 必须按调用者授权范围计算，不能返回租户全量或跨租户总数。

### 4.4 创建请求

`POST /organizations`

必需 Header：`Idempotency-Key`。

```json
{
  "parent_id": "org_01",
  "code": "PLATFORM",
  "name": "平台研发部",
  "type": "department",
  "sort_order": 20,
  "leader_user_id": null,
  "description": null
}
```

- `parent_id` 必填；根机构由租户初始化流程创建，普通创建接口不允许 `null`。
- 父节点必须存在、启用、位于调用者可写范围且移动后深度不超过 4。
- 创建必须锁定租户机构结构保护记录和父节点，在同一事务内完成启用状态、深度、编码唯一性校验、资源写入、权限版本处理和审计 Outbox 写入。
- 创建成功返回 `201`、`ETag`、`Location` 和完整资源。
- 编码冲突返回 `409 ORG_CODE_CONFLICT`。
- 相同 `Idempotency-Key` 与相同请求体重放返回首次成功结果；同 key 不同请求体返回 `409 IDEMPOTENCY_KEY_REUSED`。

### 4.5 修改请求

`PATCH /organizations/{organization_id}`

必需 Header：`If-Match: "<version>"`。

请求体至少包含一个可修改字段：

```json
{
  "name": "平台与基础设施部",
  "type": "department",
  "sort_order": 15,
  "leader_user_id": "user_01",
  "description": "负责平台基础设施"
}
```

不通过此接口修改：

- `tenant_id`
- `id`
- `code`
- `parent_id`，使用 `/move`
- `status`，使用 `/status`
- `version`
- `created_at`、`updated_at`、`depth`

成功后返回完整资源和新 `ETag`。

### 4.6 移动请求

`POST /organizations/{organization_id}/move`

必需 Header：`Idempotency-Key`、`If-Match: "<version>"`。

```json
{
  "target_parent_id": "org_02",
  "sort_order": 30
}
```

事务要求：

1. 锁定租户机构结构保护记录或等价串行化资源。
2. 锁定源机构、源子树和目标父机构。
3. 校验源机构不是根节点。
4. 校验目标父节点存在、启用且位于可写范围。
5. 禁止移动到自身或任意后代。
6. 计算移动后的整棵子树深度，最大不得超过 4。
7. 更新层级与排序，递增源机构和受影响资源版本。
8. 对“主属机构位于源子树的用户、绑定范围为源机构/子树/后代的用户”递增 `permissions_version`。
9. 写入 `organization.moved` 审计事件和事务性 Outbox。
10. 事务提交后返回完整资源和新 `ETag`。

任何一步失败都必须整体回滚。

### 4.7 状态变更请求

`POST /organizations/{organization_id}/status`

必需 Header：`Idempotency-Key`、`If-Match: "<version>"`。

```json
{
  "status": "inactive",
  "reason": "组织调整"
}
```

规则：

- 启用和停用共用同一接口和 `iam:organization:update-status`。
- 根机构停用是否允许由后端安全策略补充；默认应禁止停用根机构。
- 状态变更必须锁定租户机构结构保护记录、目标机构和父机构，在同一事务内完成活动子节点、活动成员、根保护和目标状态校验。
- v0.2 不做级联停用；存在启用子节点或活动成员时返回 `409`。
- 启用要求父节点为 `active`，根节点除外。
- `reason` 只用于审计摘要，不得包含敏感信息。
- 状态变化后递增受影响用户的 `permissions_version`。
- 重复提交相同目标状态返回当前资源还是 `409 ORG_INVALID_STATE` 必须由后端最终统一；前端不得猜测成功。

### 4.8 删除与恢复

v0.2 不定义 `DELETE` 或恢复接口。首期产品决策为只停用与启用，不提供删除或恢复；不得在 `src/api/`、路由、权限目录或页面动作中创建删除请求函数或入口。后续若引入删除，必须单独评审引用保留、审计、恢复和迁移策略。

## 5. 业务规则

### 5.1 唯一性、根节点与深度

- `(tenant_id, code_normalized)` 唯一。
- 同一父节点下允许同名显示，但编码仍租户内唯一。
- 每个租户有且只有一个根机构，根 `parent_id = null`、`depth = 1`。
- 后端应使用租户内单根唯一约束或等价数据库不变量，而不能只依赖服务层查询。
- 根节点不可移动、不可普通删除；是否允许停用由安全策略决定，默认禁止。
- 普通创建只创建非根节点。
- 最大深度为 4；移动和创建都必须在事务中校验。
- `parent_id` 不得等于自身；任何移动都必须做循环检测。

### 5.2 数据范围与授权

- 列表、树、详情、分页总数、移动目标搜索和状态变更使用同一数据范围。
- 缺少功能权限返回 `403`。
- 已认证且有功能权限，但对象不存在或位于范围外时返回 `404 ORG_NOT_FOUND`。
- 创建或移动时父节点不可用时返回 `404 ORG_PARENT_NOT_FOUND`，不泄露其存在状态。
- 客户端不得提交 `tenant_id`、`scope`、`all` 或 `platform_all` 扩大范围。
- 普通租户 API 不因 `platform_admin` 角色自动绕过租户约束。

### 5.3 并发、版本和幂等

- 读响应提供 `version` 和 `ETag`。
- `PATCH`、`move`、`status` 强制要求 `If-Match`。
- 缺 `If-Match` 返回 `428 PRECONDITION_REQUIRED`。
- 版本不匹配返回 `412 ORG_VERSION_CONFLICT`，并附当前版本。
- 业务状态冲突返回 `409`，不得与版本过期混用。
- 页面不得自动覆盖冲突；必须要求刷新或显式重试。
- 幂等查找键与请求指纹分离：

```text
lookup_key = tenant_id + actor_id + method + canonical_path + Idempotency-Key
request_fingerprint = canonical_method + canonical_path + canonical_body_hash
```

- 幂等记录状态机为 `pending → succeeded | failed | expired`；同一 lookup key 的并发请求必须由唯一约束或等价的原子抢占机制串行化。
- `pending` 状态收到重复请求时返回 `409 IDEMPOTENCY_IN_PROGRESS`，不得再次执行业务写操作。
- 成功后重放必须优先于 `If-Match` 等业务前置条件，返回首次终态、原成功状态码、响应体、`ETag`、`Location` 和 `X-Request-Id`，不重复写审计。
- 同 key 不同请求指纹返回 `409 IDEMPOTENCY_KEY_REUSED`。
- 首次请求以确定性 `4xx` 失败时，记录可按后端策略不缓存并允许修正后重试；`5xx`、超时或结果未知时不得自动重放写操作。建议幂等记录保留期为 24 小时，但当前未登记为已批准工程默认值，最终值、清理任务和存储要求必须由后端确认。
- 规范化请求体、指纹算法、记录 TTL 和清理任务必须写入真实后端契约和测试。

### 5.4 事务、审计和权限版本

- 所有写操作使用业务事务。
- 创建、移动、状态变更和租户初始化根机构必须使用同一个租户级机构结构串行化资源。固定锁顺序为“租户结构保护记录 → 源子树 → 目标父机构”，并明确隔离级别、超时和死锁重试策略。
- 高风险写操作必须同时写 `audit_event_v1` 和事务性 Outbox；Outbox 失败则业务失败关闭。
- 机构移动、停用、启用或引用变化必须在同一事务内按第 4.6 节集合递增受影响用户的 `permissions_version`。
- 状态变化、用户调岗或机构引用变化必须在同一事务内处理相关权限失效。
- 审计投递失败必须告警和补偿，不得静默丢失。

审计 Outbox 候选状态机：

```text
pending → publishing → delivered
                      ↘ retryable_failed → publishing
                      ↘ terminal_failed → manual_reconciliation
```

- 业务事务只允许写 `pending`，不得在事务提交前宣称审计已投递。
- `delivered` 必须幂等并记录投递时间；`terminal_failed` 必须告警且禁止静默丢失。
- 授权拒绝事件使用独立可靠安全审计通道，不能依赖会因业务事务回滚而消失的 Outbox。
- `audit_event_v1` 的完整 Schema、最大投递时延和人工补偿责任仍待安全/运维/后端签收。

## 6. 错误契约

| HTTP | 业务错误码 | 场景 | 前端行为 |
|---|---|---|---|
| `400` | `ORG_VALIDATION_FAILED` | 字段缺失、长度、枚举或格式错误 | 标记字段并保留输入 |
| `401` | `UNAUTHORIZED` | Session 缺失、过期或版本失效 | 回登录，不显示业务错误页 |
| `403` | `ORG_FORBIDDEN` | 缺少功能权限 | 禁止访问或隐藏写入口 |
| `404` | `ORG_NOT_FOUND` | 机构不存在或在数据范围外 | 统一不可用状态，不泄露存在性 |
| `404` | `ORG_PARENT_NOT_FOUND` | 创建或移动父节点不可用 | 要求重新选择父节点 |
| `404` | `ORG_LEADER_NOT_FOUND` | 负责人不存在或在可校验范围外 | 要求重新选择负责人 |
| `409` | `ORG_CODE_CONFLICT` | 编码重复 | 提示修改编码 |
| `409` | `ORG_PARENT_INACTIVE` | 父节点已停用 | 禁用目标任务并提示 |
| `409` | `ORG_CYCLE` | 移动到自身或后代 | 提示目标非法 |
| `409` | `ORG_MAX_DEPTH_EXCEEDED` | 超过最大四级 | 提示调整目标父节点 |
| `409` | `ORG_HAS_ACTIVE_CHILDREN` | 停用时仍有启用子节点 | 先处理子节点 |
| `409` | `ORG_HAS_ACTIVE_MEMBERS` | 停用时仍有活动成员 | 先迁移成员 |
| `409` | `ORG_ROOT_PROTECTED` | 尝试创建第二个根或停用根 | 阻止操作 |
| `409` | `ORG_INVALID_STATE` | 启停状态冲突 | 刷新当前状态 |
| `409` | `IDEMPOTENCY_KEY_REUSED` | 相同 key 对应不同请求体 | 生成新 key 或刷新页面 |
| `409` | `IDEMPOTENCY_IN_PROGRESS` | 相同 key 的首次请求仍在处理中 | 禁止并发写，提示稍后查询结果 |
| `412` | `ORG_VERSION_CONFLICT` | `If-Match` 版本过期 | 提示数据已变化并刷新 |
| `428` | `PRECONDITION_REQUIRED` | 缺少 `If-Match` | 重新加载资源后重试 |
| `429` | `RATE_LIMITED` | 请求频率超限 | 按 `Retry-After` 提示，不自动重试写操作 |
| `500/502/503` | `ORG_SERVER_ERROR` | 服务端错误 | 显示重试入口，不猜测成功 |

## 7. 审计事件

机构写操作必须产生 `audit_event_v1`：

```text
organization.created
organization.updated
organization.moved
organization.status_changed
organization.access_denied
```

最少字段：

| 字段 | 必填 | 说明 |
|---|---|---|
| `event_id` | 是 | 幂等键 |
| `event_type` | 是 | 上述事件名 |
| `event_version` | 是 | 固定为 `1` |
| `occurred_at` | 是 | UTC 时间 |
| `tenant_id` | 是 | 租户边界 |
| `actor_type` / `actor_id` | 是 | 操作者类型和 ID |
| `request_id` | 是 | 请求追踪 ID |
| `resource_type` / `resource_id` | 是 | `organization` 与机构 ID |
| `result` | 是 | `success/failure` |
| `reason_code` | 是 | 业务错误码或策略原因 |
| `before_summary` / `after_summary` | 条件 | 脱敏差异摘要 |
| `source_ip` / `user_agent` | 条件 | 安全与隐私策略允许时记录 |

不得记录密码、Token、Cookie、完整敏感个人信息或未经脱敏的请求体。

## 8. OpenAPI 与契约测试计划

OpenAPI 提案位于 `organization.openapi.yaml`，使用 OpenAPI 3.1，包含完整路径、Schema、成功/错误示例、稳定错误码，以及权限、数据范围、租户上下文、幂等、并发和审计扩展元数据。它是契约候选，不是后端已实现证明，也不是后端签收记录。

后端确认后，`src/api/organizations/` 至少需要覆盖：

- 成功响应 Schema 校验和未知字段策略。
- `401`、`403`、`404`、`409`、`412`、`428`、`429` 和网络错误映射。
- 双租户越权：树、列表、详情、计数和移动目标全部隔离。
- 单根、四级、循环移动和并发移动。
- 编码规范化与 `(tenant_id, code_normalized)` 唯一。
- `ETag/If-Match`、`409` 业务冲突和 `412` 版本冲突。
- `Idempotency-Key` 重放与同 key 不同 body。
- 写操作产生审计 Outbox，失败时业务回滚。
- 权限版本递增后旧权限缓存失效。
- 树节点包含 `children`，扁平列表节点不包含。

本轮只做契约和文档检查，不执行实现测试，也不创建请求函数。

## 9. 后端 OpenAPI 补充要求

`organization.openapi.yaml` 是前端与后端联合评审用的提案文件，不是后端已实现契约，也不能作为 `src/api/` 的接入依据。机构 API 冻结前，后端必须补充并提交真实 OpenAPI 3.1 或等价可校验 Schema，至少覆盖：

- 真实服务器地址、认证方式和 CSRF/请求追踪 Header。
- 全部路径、HTTP 方法、请求参数、请求体和成功响应 Schema。
- 租户上下文的注入位置和禁止客户端切换租户的约束。
- `tenant_id`、不透明 ID、`active/inactive`、`depth` 和 `version` 的字段类型与约束。
- `401/403/404/409/412/428/429/5xx` 错误结构及稳定业务错误码。
- `ETag/If-Match` 并发控制、`Idempotency-Key` 行为和幂等重放响应。
- 审计 Outbox、`request_id`、受影响用户 `permissions_version` 递增语义。
- 可执行请求/响应示例，以及与本文冲突时的变更记录。

后端 OpenAPI 到位后，必须执行 OpenAPI lint、示例 Schema 校验和与本文/前端 Schema 的差异审查。差异未关闭前，冻结状态保持 `NOT FREEZABLE`。

## 10. 冻结条件

机构 API v0.2 从 `NOT FREEZABLE` 升级为 `FROZEN` 前必须满足：

- ADR-001 已由产品、后端、安全、运维和前端签收。
- 权限矩阵 v0.2 已签收。
- `MANUAL-01` 至 `MANUAL-12` 的产品结论已全部落位。
- 后端已提交真实 OpenAPI 或等价 Schema，且与本文差异已关闭。
- 后端确认真实 OpenAPI、错误结构和事务实现可行。
- 前端确认 Schema、路由、权限展示和交互门禁。
- OpenAPI lint 和示例 Schema 校验通过。
- 机构树、移动和状态变更已有 HTML 原型，并通过实现评审。
