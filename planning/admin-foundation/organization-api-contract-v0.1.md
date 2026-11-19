# 机构 API 契约 v0.1（历史提案）

- 变更 ID：`admin-foundation`
- 状态：`SUPERSEDED`
- 替代文档：`organization-api-contract-v0.2.md`、`organization.openapi.yaml`
- 日期：2026-11-14
- 关联文档：`adr-001-identity-tenant-organization.md`、`role-permission-matrix.md`、`capability-map.md`
- 适用范围：机构树、机构基础资料、机构移动和机构状态管理

> **重要说明：当前仓库没有已实现的机构 API。** 本文中的路径、字段、错误码、权限码和状态语义均为 v0.1 提案，不是当前后端事实，也不是可立即接入 `src/api/` 的请求函数。只有后端确认并提供 OpenAPI 或等价 Schema 后，才能进入接口实现。本文不包含 TypeScript 请求实现。

## 1. 目标与非目标

### 目标

- 定义机构域最小读模型和写操作集合。
- 冻结机构树、移动、停用、删除、并发控制和审计语义。
- 为后端 OpenAPI、前端 Zod Schema、页面低保真和契约测试提供共同讨论基线。
- 保证机构数据范围与服务端授权一致，避免通过列表、详情、计数、移动或删除绕过范围。

### 非目标

- 不定义用户、角色、字典、公告和审计查询 API。
- 不定义数据导入、异步批处理、审批流或 SCIM。
- 不决定数据库表结构、ORM、缓存实现或具体 IdP 产品。
- 不把多租户模型默认塞入本契约；若确认多租户，必须先按 ADR-001 引入 `tenant_id` 硬边界。
- 不允许前端用 fixture 模拟写操作并宣称为真实接口。

## 2. 通用约定

| 项目 | 提案 |
|---|---|
| API 基础地址 | `VITE_API_BASE_URL`，默认 `` |
| 资源路径 | `/organizations` |
| 数据格式 | `application/json; charset=utf-8` |
| 字段命名 | 后端 JSON 使用 `snake_case`；前端 Schema 映射为现有项目习惯 |
| ID | 使用后端不透明字符串；前端不得假设一定是自增整数或 UUID |
| 时间 | ISO 8601 UTC 字符串，例如 `2026-11-14T08:30:00Z` |
| 认证 | HttpOnly Session Cookie；所有接口要求已认证 |
| CSRF | 所有 `POST`、`PATCH`、`DELETE` 必须携带现有 CSRF 机制要求的 Header |
| 请求追踪 | 客户端发送 `X-Request-Id`；服务端在响应和错误中返回 `X-Request-Id` |
| 分页 | `page` 从 1 开始；`perPage` 由后端限制最大值 |
| 排序 | `sort_by` 只接受白名单字段；推荐 `sort_order`、`created_at`、`updated_at` |
| 并发控制 | 可变实体暴露整数 `version`；写操作使用 `If-Match: "<version>"` 做乐观锁 |
| 数据范围 | 服务端根据会话身份和角色绑定过滤；客户端不得通过 `scope` 参数扩大范围 |

### 2.1 时间、状态和编码

- `status` 枚举：`active`、`disabled`。
- `type` 首期建议为 `company`、`department`、`team`、`other`；后端可改为受控字典，但必须是稳定枚举，不接受任意业务字符串。
- `code` 在租户内全局唯一；单租户部署即平台内唯一。比较应忽略首尾空白，是否大小写敏感由数据库排序规则和 API 统一决定。
- `code` 建议创建后不可修改，保证外部引用、审计和权限范围稳定；修改编码需要独立设计迁移语义。
- 根机构 `parent_id = null`。是否允许多个根节点由后端确认；本提案支持受限多根。
- `sort_order` 为同级排序值，数值越小越靠前；相同值必须使用稳定的第二排序键。

### 2.2 响应和错误外壳

成功响应直接返回资源或分页对象，沿用当前 `Result<T>` 在 HTTP 层的包装方式。不要在前端请求层再次套一层业务信封。

建议错误响应：

```json
{
  "code": "ORG_VERSION_CONFLICT",
  "message": "Organization was modified by another request",
  "details": {
    "organization_id": "org_01",
    "current_version": 8
  }
}
```

- HTTP 状态码交给现有 `toApiError` 映射为通用 `ApiErrorCode`。
- 业务错误码放在响应体 `code`；不得用字符串解析 `message` 判断行为。
- `message` 不得包含敏感信息；前端展示应映射为可读 i18n 文案。
- 错误详情只能包含排障所需字段，不回传完整内部堆栈。

## 3. 端点提案

| 方法 | 路径 | 用途 | 功能权限 | 数据范围与说明 |
|---|---|---|---|---|
| `GET` | `/organizations/tree` | 获取授权范围内的机构树 | `iam:organization:read` | 服务端只返回可见节点；支持按根节点和深度读取 |
| `GET` | `/organizations` | 分页获取扁平机构列表 | `iam:organization:read` | 用于搜索和管理列表；结果受同一数据范围过滤 |
| `GET` | `/organizations/{id}` | 获取单个机构 | `iam:organization:read` | 范围外对象建议返回 `404`，避免枚举 |
| `POST` | `/organizations` | 创建机构 | `iam:organization:create` | 父节点必须存在、启用且位于可写范围 |
| `PATCH` | `/organizations/{id}` | 修改名称、类型、排序、负责人等 | `iam:organization:update` | 不用于移动层级或状态变更 |
| `POST` | `/organizations/{id}/move` | 移动到新的父节点 | `iam:organization:move` | 源节点和目标父节点均须在范围内；禁止环 |
| `POST` | `/organizations/{id}/disable` | 停用机构 | `iam:organization:disable` | v0.1 不级联停用；有活动子节点或成员时拒绝 |
| `POST` | `/organizations/{id}/enable` | 启用机构 | `iam:organization:disable` | 与停用共用受保护状态管理能力；父节点必须启用 |
| `DELETE` | `/organizations/{id}` | 删除空叶子机构 | `iam:organization:delete` | 仅允许无子节点、无成员、无业务引用的叶子节点 |

> **权限码待确认：** `enable` 复用 `iam:organization:disable` 只是 v0.1 建议，用于避免把同一安全能力拆成两个易混淆权限。若后端权限目录坚持拆分为 `iam:organization:enable`，必须同步更新角色权限矩阵。

## 4. 领域模型

### 4.1 `Organization`

```json
{
  "id": "org_01",
  "code": "RND",
  "name": "研发中心",
  "type": "department",
  "status": "active",
  "parent_id": null,
  "sort_order": 10,
  "leader_user_id": null,
  "description": "研发组织",
  "member_count": 42,
  "version": 3,
  "created_at": "2026-11-01T08:00:00Z",
  "updated_at": "2026-11-14T08:30:00Z",
  "disabled_at": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 不透明资源 ID |
| `code` | string | 是 | 租户内唯一编码；建议创建后不可改 |
| `name` | string | 是 | 显示名称，去除首尾空白后非空 |
| `type` | enum | 是 | `company`、`department`、`team`、`other`，待后端确认 |
| `status` | enum | 是 | `active`、`disabled` |
| `parent_id` | string \| null | 是 | 根节点为 `null` |
| `sort_order` | integer | 是 | 同级排序值 |
| `leader_user_id` | string \| null | 是 | 负责人用户 ID；无权查看用户详情时仍可显示名称需另行定义 |
| `description` | string \| null | 是 | 可为空；长度限制由后端确认 |
| `member_count` | integer | 否 | 授权范围内的成员数；若不保证一致则删除 |
| `version` | integer | 是 | 乐观锁版本，每次有效写入递增 |
| `created_at` | string | 是 | 创建时间 |
| `updated_at` | string | 是 | 最后更新时间 |
| `disabled_at` | string \| null | 是 | 停用时间；启用后是否清空由后端确认 |

`OrganizationTreeNode` 在 `Organization` 基础上增加：

```json
{
  "children": []
}
```

不要把 `children` 用于扁平列表响应，避免列表和树两个 Schema 混淆。

### 4.2 机构树响应

`GET /organizations/tree`

查询参数：

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `root_id` | string | 无 | 从指定可见节点开始；不存在或不可见时返回 `404` |
| `include_disabled` | boolean | `false` | 是否包含停用节点；仍受数据范围限制 |
| `max_depth` | integer | 后端默认 | 限制返回深度；防止一次加载过大树 |
| `keyword` | string | 无 | 可选搜索；匹配节点及其必要祖先，不得返回范围外节点 |

响应示例：

```json
{
  "items": [
    {
      "id": "org_01",
      "code": "HQ",
      "name": "集团总部",
      "type": "company",
      "status": "active",
      "parent_id": null,
      "sort_order": 10,
      "leader_user_id": null,
      "description": null,
      "member_count": 120,
      "version": 5,
      "created_at": "2026-11-01T08:00:00Z",
      "updated_at": "2026-11-14T08:30:00Z",
      "disabled_at": null,
      "children": []
    }
  ],
  "meta": {
    "root_id": null,
    "include_disabled": false,
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
| `perPage` | integer | 默认由后端决定，前端不得假设无上限 |
| `search` | string | 匹配编码或名称，具体匹配规则由后端文档确认 |
| `parent_id` | string | 直接父节点过滤；根节点过滤方式需单独定义 |
| `status` | enum | `active` 或 `disabled` |
| `type` | enum | 机构类型 |
| `sort_by` | string | 白名单字段 |
| `sort_order` | enum | `asc` 或 `desc` |

响应示例：

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 0,
    "totalPage": 0
  }
}
```

`total` 必须按调用者数据范围计算，不能返回全平台总数。

### 4.4 创建请求

`POST /organizations`

```json
{
  "code": "PLATFORM",
  "name": "平台研发部",
  "type": "department",
  "parent_id": "org_01",
  "sort_order": 20,
  "leader_user_id": null,
  "description": null
}
```

- `parent_id = null` 是否允许由后端按根节点策略确认。
- 创建成功后返回 `201` 和完整 `Organization`。
- 编码冲突返回 `409 ORG_CODE_CONFLICT`。
- 父节点不在可写范围、停用或达到最大深度时拒绝。

### 4.5 修改请求

`PATCH /organizations/{id}`

请求 Header：

```text
If-Match: "3"
```

请求体只包含可变字段，至少一个字段：

```json
{
  "name": "平台与基础设施部",
  "type": "department",
  "sort_order": 15,
  "leader_user_id": "user_01",
  "description": "负责平台基础设施"
}
```

不建议通过此接口修改：

- `id`
- `code`（v0.1 建议不可变）
- `parent_id`（使用 `/move`）
- `status`（使用 `/disable` 或 `/enable`）
- `version`
- `created_at`、`updated_at`

### 4.6 移动请求

`POST /organizations/{id}/move`

```text
If-Match: "3"
```

```json
{
  "target_parent_id": "org_02",
  "sort_order": 30
}
```

- `target_parent_id` 必须存在、启用且在可写范围。
- 禁止把节点移动到自身或任意后代节点。
- 若移动会导致超过最大深度，必须拒绝。
- 成功后返回更新后的 `Organization`。
- 机构移动可能改变用户和角色的有效数据范围，后端必须使相关权限快照失效。

### 4.7 停用与启用请求

`POST /organizations/{id}/disable`

```text
If-Match: "3"
```

```json
{
  "reason": "组织调整"
}
```

`POST /organizations/{id}/enable`

```text
If-Match: "3"
```

```json
{
  "reason": "组织恢复"
}
```

- 停用和启用必须幂等可判断；重复调用返回明确状态，不应产生重复审计事实。
- v0.1 停用不做级联。存在活动子节点或活动成员时返回冲突。
- 启用要求父节点处于启用状态；根节点除外。
- 状态变化后旧会话的机构范围应失效或提升权限版本。

### 4.8 删除请求

`DELETE /organizations/{id}`

```text
If-Match: "3"
```

可选查询参数：`reason`，但不得包含敏感信息。删除前必须同时满足：

- 无子节点。
- 无机构成员关系。
- 无角色绑定、公告受众、字典引用或其他业务引用。
- 调用者拥有 `iam:organization:delete` 且对象在范围内。

建议删除成功返回 `204 No Content`。若业务需要保留审计可读性，优先停用而非删除。

## 5. 业务规则

### 5.1 唯一性与层级

- `code` 在租户内唯一；多租户场景必须在租户内唯一，不能全局混用。
- 同一父节点下允许同名显示，但编码唯一。
- `parent_id` 不得等于自身。
- 任何移动必须执行循环检测，禁止形成 `A -> B -> A`。
- 默认最大树深由后端配置；超过上限返回可识别错误。
- 根节点数量策略、最大深度和是否允许多根必须在 OpenAPI 中写明。

### 5.2 数据范围

- 列表、树、详情、分页总数、移动目标搜索和删除检查使用同一数据范围。
- 缺少功能权限返回 `403`。
- 已认证且拥有功能权限，但目标对象不在数据范围时，建议返回 `404 ORG_NOT_FOUND`，避免探测其他机构。
- 创建时父节点在范围外按“不可用父节点”处理，不泄露其存在状态。
- 不允许客户端通过请求参数选择 `all`、`org_subtree` 等范围扩大结果。
- 机构移动、停用和角色绑定变化后，服务端必须使受影响权限快照失效。

### 5.3 并发与一致性

- 读响应提供 `version`。
- 所有更新、移动、启停和删除请求使用 `If-Match`。
- 版本不匹配返回 `409 ORG_VERSION_CONFLICT`，并返回当前版本供前端提示刷新。
- 页面不得自动覆盖冲突；必须要求用户刷新或显式重试。
- 写操作成功后不能只返回空对象；前端需要更新后的资源或明确版本。

## 6. 错误契约

| HTTP | 业务错误码 | 场景 | 前端行为 |
|---|---|---|---|
| `400` | `ORG_VALIDATION_FAILED` | 字段缺失、长度、枚举或格式错误 | 标记字段并保留输入 |
| `401` | `UNAUTHORIZED` | 会话失效 | 回到登录，不显示业务错误页 |
| `403` | `ORG_FORBIDDEN` | 缺少功能权限 | 禁止访问或隐藏写入口 |
| `404` | `ORG_NOT_FOUND` | 机构不存在或不在数据范围 | 显示统一不可用状态，不泄露范围外信息 |
| `404` | `ORG_PARENT_NOT_FOUND` | 创建或移动目标父节点不可用 | 要求重新选择父节点 |
| `409` | `ORG_CODE_CONFLICT` | 编码重复 | 提示修改编码 |
| `409` | `ORG_VERSION_CONFLICT` | `If-Match` 版本过期 | 提示数据已变化，要求刷新 |
| `409` | `ORG_PARENT_DISABLED` | 父节点已停用 | 禁用目标任务并提示 |
| `409` | `ORG_CYCLE` | 移动到自身或后代 | 阻止提交并提示目标非法 |
| `409` | `ORG_MAX_DEPTH_EXCEEDED` | 超过最大层级 | 提示调整目标父节点 |
| `409` | `ORG_HAS_ACTIVE_CHILDREN` | 停用或删除仍有子节点 | 先处理子节点 |
| `409` | `ORG_HAS_MEMBERS` | 停用或删除仍有成员 | 先迁移成员 |
| `409` | `ORG_HAS_REFERENCES` | 删除仍有业务引用 | 改为停用或解除引用 |
| `409` | `ORG_INVALID_STATE` | 重复启停或其他状态冲突 | 刷新当前状态 |
| `429` | `RATE_LIMITED` | 请求频率超限 | 按 `Retry-After` 提示，不自动重试写操作 |
| `500/502/503` | `ORG_SERVER_ERROR` | 服务端错误 | 显示重试入口，不猜测成功 |

### 6.1 契约测试要求

后端确认后，`src/api/organizations/` 至少需要覆盖：

- 成功响应 Schema 校验。
- 未知字段策略：允许后端新增字段还是严格拒绝，必须统一。
- `401`、`403`、`404`、`409`、`422`、`429` 和网络错误。
- `If-Match` 版本冲突。
- 数据范围外列表为空、详情不可见。
- 树节点包含 `children`，列表节点不包含。
- 编码冲突、循环移动和删除约束。

## 7. 审计事件

机构写操作必须产生追加式审计事件。建议事件名：

```text
organization.created
organization.updated
organization.moved
organization.disabled
organization.enabled
organization.deleted
```

每条事件至少包含：

| 字段 | 说明 |
|---|---|
| `event_id` | 唯一事件 ID |
| `event_type` | 上述事件名 |
| `occurred_at` | 服务端时间 |
| `actor_user_id` | 操作者业务用户 ID |
| `actor_identity_id` | 可选，外部身份关联 |
| `organization_id` | 目标机构 |
| `source_parent_id` / `target_parent_id` | 移动时记录 |
| `result` | `success` 或 `denied`/`failed` |
| `request_id` | 与响应 `X-Request-Id` 一致 |
| `ip` / `user_agent` | 按安全与隐私策略记录 |
| `before` / `after` | 脱敏字段差异，不记录敏感正文 |

- 审计写入与业务事务的关系必须明确；建议事务内 Outbox 或等价可靠机制。
- 审计查询 API 不在本契约内，但事件字段从现在起必须稳定。
- 拒绝的跨范围写操作也应记录安全审计。

## 8. 前端使用边界

后端确认前：

- 可以创建 Schema 草案、fixture 和低保真，但不得新增真实请求函数。
- 不得在页面中硬编码 `/organizations` 并宣称接口已接入。
- 不得用 `is_admin` 模拟完整权限矩阵。
- 不得用前端树结构自行计算最终数据范围。

后端确认后：

- `src/api/organizations/` 只消费确认后的 OpenAPI。
- 所有响应先通过 Zod 或等价 Schema 校验。
- 页面只调用领域公共出口，不直接使用 Axios。
- 权限码只有在 `AuthUser`、路由 meta 和 guard 契约确认后才启用。
- 机构树、移动和状态流程必须先通过 `interaction-and-reference.md` 的关键线框评审。

## 9. 待后端确认问题

| 编号 | 问题 | 当前建议 |
|---|---|---|
| API-01 | 机构 ID 是 UUID、数字还是其他不透明 ID？ | 前端始终按不透明 string 处理 |
| API-02 | 是否允许多个根节点？ | 允许受限多根；有明确上限 |
| API-03 | `code` 是否创建后不可变？ | 建议不可变 |
| API-04 | 编码大小写和空白如何规范化？ | API 统一规范化并给出明确错误 |
| API-05 | 停用是否级联到子树或成员？ | v0.1 不级联，有活动子节点/成员则拒绝 |
| API-06 | 禁用机构后成员会话是否立即失效？ | 必须定义权限版本或会话刷新策略 |
| API-07 | 删除是否需要审批或软删除？ | 优先停用；硬删除仅空叶子且强审计 |
| API-08 | 同范围外对象返回 `403` 还是 `404`？ | 建议统一 `404`，缺少功能权限才 `403` |
| API-09 | `If-Match` 格式和错误字段是什么？ | 使用引号包裹整数版本 |
| API-10 | `member_count` 是否可在范围内稳定计算？ | 不确定则不返回该字段 |
| API-11 | 机构移动是否触发角色绑定范围迁移？ | 不自动迁移业务绑定；显式提示并失效权限快照 |
| API-12 | 是否引入多租户？ | 若引入，先增加 `tenant_id` 硬边界并重写本契约 |

## 10. 契约冻结检查表

- [ ] 后端提供 OpenAPI 或等价 Schema。
- [ ] 端点、状态码、错误码、分页和字段命名已确认。
- [ ] `version` 与 `If-Match` 语义已确认。
- [ ] 机构唯一性、根节点、最大深度和删除约束已确认。
- [ ] 数据范围、范围外响应和安全审计策略已确认。
- [ ] 权限码目录和启用/停用权限已确认。
- [ ] 机构移动后的权限快照失效机制已确认。
- [ ] 审计事件字段和可靠写入机制已确认。
- [ ] 契约测试样例已准备。
- [ ] 评审通过后另行创建实现任务，不在本规划任务中写代码。
