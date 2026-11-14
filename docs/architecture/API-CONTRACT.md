# API Contract

本文件定义 `src/api` 层的契约规则，不新增未定义的后端端点。

## 基础地址

- 业务 API：`VITE_API_BASE_URL`，默认 `/v2`；可对接任意兼容该前缀的后端。
- 认证 API：`VITE_AUTH_BASE_URL`，默认空字符串，对应 `/auth/*` 和 `/v2/users/me`。
- 所有请求默认 `withCredentials: true`；认证依赖 HttpOnly Session Cookie，不使用前端 token。

## 分层

- `src/services/http/`：Axios 实例、超时、请求 ID、`Result<T>` 和错误归一化。
- `src/api/<domain>/`：领域端点、响应 Schema、请求/响应类型和契约测试。
- `src/modules/<domain>/`：页面、私有状态和 UI；只消费 `src/api/<domain>` 的公共入口。

## 规则

1. 未确认后端契约前，只允许放 Schema/类型，不虚构请求函数。
2. 每个领域通过 `src/api/<domain>/index.ts` 暴露公共 API；模块不引用内部文件。
3. 所有响应必须经过 Zod 或等价 Schema 校验；Schema 漂移返回 `VALIDATION`。
4. 错误使用 `ApiError` 归一化；至少覆盖 `NETWORK`、`TIMEOUT`、`UNAUTHORIZED`、`FORBIDDEN`、`NOT_FOUND`、`VALIDATION`、`CONFLICT`、`RATE_LIMIT`、`SERVER`。
5. `401` 清除本地会话状态并回到登录（登录接口自身的 `401` 除外）；`403` 保留已确认身份并进入禁止访问页面。后端授权是安全边界，前端只负责一致的导航行为。
6. 请求 ID、超时、取消和错误详情不得在页面层重复实现。
7. 不跨域导入 API；跨域共享能力放 `src/services` 或公共类型。
8. `429` 归一化为 `RATE_LIMIT`，并从 `Retry-After` 解析 `retryAfterSeconds`。没有幂等性保证时，页面和 HTTP 层不得自动重试状态变更请求。

## 已定义端点

### Auth

详见 `docs/architecture/AUTH-AND-PERMISSIONS.md`。实现位于 `src/api/auth/`。认证配置已接入登录页 SSO 入口，修改密码已接入 `/account/password` 页面；前端不新增或推测未登记端点。

### GPU Devices

该端点是可选 GPUStack 示例适配，不属于通用框架根导出。

- `GET /v2/gpu-devices`
- 查询参数：`page`、`perPage`、`search`、`cluster_id`、`sort_by`；`watch=true` 为 SSE，当前前端 API 不封装。
- 响应：`{ items: GPUDevicePublic[], pagination: { page, perPage, total, totalPage } }`。
- `GET /v2/gpu-devices/{id}`：单个 GPU 设备。
- 主要字段：`id`、`worker_id`、`worker_name`、`worker_ip`、`worker_ifname`、`cluster_id`、`name`、`vendor`、`index`、`uuid`、`core`、`memory`、`temperature`、`network`。
- 实现位于 `src/api/resources/gpu-device.ts`。

## 领域状态

| 领域 | 已定义内容 | 未提供内容 |
|---|---|---|
| Auth | 登录、登出、当前用户、修改密码、`is_admin` | 真实后端 Cookie/CSRF/Origin 集成配置 |
| GPU Devices | `GET /v2/gpu-devices`、`GET /v2/gpu-devices/{id}`、分页/搜索/排序参数 | 仅示例页面，默认关闭 |
| Nodes | 无 | 端点、分页、筛选、错误码、权限 |
| Models | 无 | 端点、分页、筛选、错误码、权限 |
| Deployments | 无 | 端点、分页、筛选、错误码、权限 |
| Services | 无 | 端点、分页、筛选、错误码、权限 |
| Settings | 无 | 端点、写入语义、错误码、权限 |
| Permissions | 仅 `is_admin` 管理员能力 | 其他权限 token 与后端授权语义 |

没有端点定义的领域只能登记类型或占位，不得新增请求函数或页面实现。真实端点以后端契约、OpenAPI 或接口文档为准。
