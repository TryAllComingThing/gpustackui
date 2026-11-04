# API Contract

状态：`APPROVED`。本文件定义 `src/api` 层的契约规则，不新增未冻结的后端端点。

## 基础地址

- 业务 API：`VITE_API_BASE_URL`，默认 `/v2`，对应 GPUStack 2.x 管理 API。
- 认证 API：`VITE_AUTH_BASE_URL`，默认空字符串，对应 `/auth/*` 和 `/v2/users/me`。
- 所有请求默认 `withCredentials: true`；认证依赖 HttpOnly Session Cookie，不使用前端 token。

## 分层

- `src/services/http/`：Axios 实例、超时、请求 ID、`Result<T>` 和错误归一化。
- `src/api/<domain>/`：领域端点、响应 Schema、请求/响应类型和契约测试。
- `src/modules/<domain>/`：页面、私有状态和 UI；只消费 `src/api/<domain>` 的公共入口。

## 规则

1. 未冻结后端契约前，只允许放 Schema/类型，不虚构请求函数。
2. 每个领域通过 `src/api/<domain>/index.ts` 暴露公共 API；模块不引用内部文件。
3. 所有响应必须经过 Zod 或等价 Schema 校验；Schema 漂移返回 `VALIDATION`。
4. 错误使用 `ApiError` 归一化；至少覆盖 `NETWORK`、`TIMEOUT`、`UNAUTHORIZED`、`FORBIDDEN`、`NOT_FOUND`、`VALIDATION`、`SERVER`。
5. `401` 清理会话并回到登录或统一未授权流程；`403` 进入禁止访问页面。具体行为以认证契约为准。
6. 请求 ID、超时、取消和错误详情不得在页面层重复实现。
7. 不跨域导入 API；跨域共享能力放 `src/services` 或公共类型。

## 已冻结端点

### Auth

详见 `docs/architecture/AUTH-AND-PERMISSIONS.md`。实现位于 `src/api/auth/`。

### GPU Devices

- `GET /v2/gpu-devices`
- 查询参数：`page`、`perPage`、`search`、`cluster_id`、`sort_by`；`watch=true` 为 SSE，当前前端 API 不封装。
- 响应：`{ items: GPUDevicePublic[], pagination: { page, perPage, total, totalPage } }`。
- `GET /v2/gpu-devices/{id}`：单个 GPU 设备。
- 主要字段：`id`、`worker_id`、`worker_name`、`worker_ip`、`worker_ifname`、`cluster_id`、`name`、`vendor`、`index`、`uuid`、`core`、`memory`、`temperature`、`network`。
- 实现位于 `src/api/resources/gpu-device.ts`。

## 当前状态

- 通用 HTTP 客户端、错误归一化、认证 API 和 GPU 设备 API 已实现。
- GPU 资源页面仍使用本地 fixture；页面接入真实 API 需要独立的加载、错误、分页和排序验收。
- 工作台、模型、部署、服务实例和权限接口尚未在本仓库冻结，不得由 Codex 自行编造。
