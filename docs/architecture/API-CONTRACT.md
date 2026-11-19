# API Contract

本文件定义 `src/api` 层的契约规则，不新增未定义的后端端点。

## 基础地址

- 业务 API：`VITE_API_BASE_URL`，默认 `/api`；使用非版本化命名空间，避免与 SPA 页面路由冲突。
- 认证 API：`VITE_AUTH_BASE_URL`，默认空字符串，对应 `/auth/*`；当前用户使用业务 API 的 `/api/users/me`。
- 所有请求默认 `withCredentials: true`；认证依赖 HttpOnly Session Cookie，不使用前端 token。

## 分层

- `src/services/http/`：Axios 实例、超时、请求 ID、`Result<T>` 和错误归一化。
- `src/api/<domain>/`：领域端点、响应 Schema、请求/响应类型和契约测试。
- `src/modules/<domain>/`：页面、私有状态和 UI；只消费 `src/api/<domain>` 的公共入口。

## 规则

1. 未确认后端契约前，只允许放 Schema/类型，不虚构请求函数。
2. 每个领域通过 `src/api/<domain>/index.ts` 暴露公共 API；模块不引用内部文件。
3. 所有响应必须经过 Zod 或等价 Schema 校验；Schema 漂移返回 `VALIDATION`。
4. 错误使用 `ApiError` 归一化；至少覆盖 `NETWORK`、`TIMEOUT`、`UNAUTHORIZED`、`FORBIDDEN`、`NOT_FOUND`、`VALIDATION`、`CONFLICT`、`PRECONDITION_FAILED`、`PRECONDITION_REQUIRED`、`RATE_LIMIT`、`SERVER`。`412` 映射为版本前提失败，`428` 映射为缺少前提。
5. 后端稳定业务码只能通过有长度和字符约束的 `serverCode` 暴露；不得把错误响应 `details` 原样复制到页面。`request_id` 优先取响应 Header，缺失时使用错误体中的字符串。
6. `401` 清除本地会话状态并回到登录（登录接口自身的 `401` 除外）；`403` 保留已确认身份并进入禁止访问页面。后端授权是安全边界，前端只负责一致的导航行为。
7. 请求 ID、超时、取消和错误详情不得在页面层重复实现。
8. 不跨域导入 API；跨域共享能力放 `src/services` 或公共类型。
9. `429` 归一化为 `RATE_LIMIT`，并从 `Retry-After` 解析 `retryAfterSeconds`。没有幂等性保证时，页面和 HTTP 层不得自动重试状态变更请求。

## 已定义端点

### Auth

详见 `docs/architecture/AUTH-AND-PERMISSIONS.md`。实现位于 `src/api/auth/`。认证配置已接入登录页 SSO 入口，修改密码已接入 `/account/password` 页面；前端不新增或推测未登记端点。

### GPU Devices

该端点是可选 GPUStack 示例适配，不属于通用框架根导出。

- `GET /api/gpu-devices`
- 查询参数：`page`、`perPage`、`search`、`cluster_id`、`sort_by`；`watch=true` 为 SSE，当前前端 API 不封装。
- 响应：`{ items: GPUDevicePublic[], pagination: { page, perPage, total, totalPage } }`。
- `GET /api/gpu-devices/{id}`：单个 GPU 设备。
- 主要字段：`id`、`worker_id`、`worker_name`、`worker_ip`、`worker_ifname`、`cluster_id`、`name`、`vendor`、`index`、`uuid`、`core`、`memory`、`temperature`、`network`。
- 实现位于 `src/api/resources/gpu-device.ts`。

### Organizations (draft contract adapter)

该领域当前实现位于 `src/api/organizations/`，依据 `planning/admin-foundation/organization.backend-openapi.yaml` 的后端交接草案生成，状态为 `DRAFT_FOR_BACKEND_RECONCILIATION`。它用于前端契约演练、页面接入和 mock 集成。`/system/organizations` 已接入该适配层：页面加载递归树，写操作提交后重新拉取树。本轮验收目标为前端契约适配与 mock 集成，已通过；真实环境联调不属于本轮要求。

- `GET /api/organizations/tree`
- `GET /api/organizations`
- `GET /api/organizations/{organization_id}`
- `POST /api/organizations`
- `PATCH /api/organizations/{organization_id}`
- `POST /api/organizations/{organization_id}/move`
- `POST /api/organizations/{organization_id}/status`
- 写操作分别要求 `Idempotency-Key`、`If-Match`，并由现有 HTTP 客户端附加 CSRF 和请求 ID。
- 创建使用 `Idempotency-Key`；更新使用 `If-Match`；移动和启停同时使用两者。页面不得自动重试写请求。
- 树查询使用 `GET /api/organizations/tree?include_inactive=true` 展示完整层级，筛选、搜索和展开在已授权响应上完成。
- 客户端请求 Schema 拒绝 `tenant_id`、`scope` 等租户切换字段；范围由后端从会话和授权策略计算。
- 稳定业务错误码通过 `ApiError.serverCode` 暴露；未知错误码或 Schema 漂移不得进入成功态。

### Admin domains (draft contract adapters)

以下领域已按同一 API 规则实现请求函数、严格请求 Schema、响应 Schema、契约单测和页面接入，并通过 mock 集成验收。它们属于前端与后端交接用的草案适配层；真实环境联调与生产部署验收列为后续阶段，不属于本轮范围。

| 领域 | 端点 | 主要语义 |
|---|---|---|
| Users | `GET /api/users`、`POST /api/users/invitations`、`GET/PATCH /api/users/{id}`、`PUT /api/users/{id}/role-bindings`、`PATCH /api/users/{id}/status`、`POST /api/users/{id}/credentials/reset`、`POST /api/users/{id}/sessions/revoke` | 分页列表、邀请、资料、角色绑定、启停、凭证与会话动作 |
| Roles | `GET/POST /api/roles`、`GET /api/roles/permissions`、`GET/PATCH /api/roles/{id}`、`PATCH /api/roles/{id}/status` | 内置角色保护、权限目录、启停 |
| Dictionaries | `GET/POST /api/dictionaries/types`、`PATCH /api/dictionaries/types/{id}`、`PATCH /api/dictionaries/types/{id}/status`、`GET/POST /api/dictionaries/types/{id}/entries`、`PATCH /api/dictionaries/entries/{id}`、`PATCH /api/dictionaries/entries/{id}/status`、`POST /api/dictionaries/types/{id}/default-entry`、`POST /api/dictionaries/cache/refresh` | 类型与项、默认项、缓存刷新 |
| Announcements | `GET/POST /api/announcements`、`GET/PATCH /api/announcements/{id}`、`POST /api/announcements/{id}/publish`、`POST /api/announcements/{id}/schedule`、`POST /api/announcements/{id}/withdraw`、`POST /api/announcements/{id}/duplicate` | 草稿、计划、发布、撤回、复制与预览快照 |
| Audit logs | `GET /api/audit/logs`、`GET /api/audit/logs/{eventId}`、`GET /api/audit/actions` | 分页筛选、只读详情、动作目录；页面不回写审计事实 |

共同约束：

- 列表响应统一为 `{ items, pagination: { page, per_page, total, total_pages } }`；组织树为 `{ items: OrganizationTreeNode[], meta }`。
- 时间字段使用带时区的 ISO 8601；ID 作为不透明字符串编码后放入路径。
- 创建仅要求 `Idempotency-Key`；更新要求 `If-Match`；状态与生命周期动作同时要求 `Idempotency-Key` 和 `If-Match`。
- CSRF、请求 ID、超时和错误归一化统一由 `src/services/http/` 处理，页面不得重复实现。
- 页面必须显式呈现 loading、empty、error、retry 和写失败状态；`412/428/429` 不得当作成功。
- 所有请求/响应字段变更必须先修改 `src/api/<domain>/schema.ts` 与契约测试，再更新页面。

## 领域状态

| 领域 | 本轮已实现与验证 | 真实环境部署阶段（非本轮验收） |
|---|---|---|
| Auth | 登录、登出、当前用户、修改密码、`is_admin` | 真实后端 Cookie/CSRF/Origin 集成配置 |
| GPU Devices | `GET /api/gpu-devices`、`GET /api/gpu-devices/{id}`、分页/搜索/排序参数 | 仅示例页面，默认关闭 |
| Organizations | 7 个机构端点、请求/响应 Schema、幂等和版本 Header 契约适配；机构页面接入、写后刷新及 mock 集成已验证 | 真实 OpenAPI 对齐、RBAC 能力返回、真实环境联调 |
| Users | 用户列表、邀请、资料、角色绑定、启停、凭证和会话端点草案；页面与 mock 集成已验证 | 真实 OpenAPI、细粒度授权与真实环境联调 |
| Roles | 角色列表、权限目录、创建、更新和启停端点草案；页面与 mock 集成已验证 | 真实 OpenAPI、内置角色与防提权服务端语义 |
| Dictionaries | 类型、项、默认项和缓存刷新端点草案；页面与 mock 集成已验证 | 真实 OpenAPI、默认项事务与缓存语义 |
| Announcements | 草稿、计划、发布、撤回和复制端点草案；页面与 mock 集成已验证 | 真实 OpenAPI、受众快照、调度与审计语义 |
| Audit logs | 列表、详情和动作目录端点草案；页面与 mock 集成已验证 | 真实 OpenAPI、游标/时间语义、脱敏与保留策略 |
| Nodes | 无 | 端点、分页、筛选、错误码、权限 |
| Models | 无 | 端点、分页、筛选、错误码、权限 |
| Deployments | 无 | 端点、分页、筛选、错误码、权限 |
| Services | 无 | 端点、分页、筛选、错误码、权限 |
| Settings | 无 | 端点、写入语义、错误码、权限 |
| Permissions | 仅 `is_admin` 管理员能力 | 其他权限 token 与后端授权语义 |

没有端点定义的领域只能登记类型或占位，不得新增请求函数或页面实现。真实端点以后端契约、OpenAPI 或接口文档为准。
