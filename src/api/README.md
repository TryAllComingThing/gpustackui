# src/api

后端契约与领域端点层。它把页面需要的请求、响应 Schema 和领域类型集中在一处；不包含 Vue 组件、页面状态或主题逻辑。

架构：`src/services/http/` 提供通用 Axios、Result 和错误归一化；`src/api/<domain>/` 定义该领域的端点、Schema 和契约类型；`src/modules/<domain>/` 只消费对应 API。

设计思路：端点按业务域集中管理，避免模块之间互相导入 API，也避免页面直接拼装 URL。没有明确后端契约前，只允许放置 Schema/类型，不虚构请求函数。`auth/` 是通用认证契约，已接入登录、SSO 配置、登出与修改密码页面；`resources/gpu-device.ts` 是可选 GPUStack 示例适配，不从根入口导出。

`organizations/` 是 R5 条件放行的机构 API 契约适配层，依据后端交接草案实现，包含 7 个端点、严格请求 Schema、递归树响应 Schema、`Idempotency-Key`/`If-Match` 映射和契约测试。它不是已签批的后端契约。`/system/organizations` 已接入树查询及创建、更新、移动、启停端点；写成功后会重新拉取树。按当前验收口径，前端契约适配与 mock 集成已通过，真实环境联调不在本轮范围。

`users/`、`roles/`、`dictionaries/`、`announcements/` 和 `audit-logs/` 同样按草案契约实现了端点、请求映射、响应 Schema 和页面接入。它们统一复用 `shared/admin.ts` 的分页、`If-Match` 和 `Idempotency-Key` 语义，并由现有 HTTP 客户端附加 CSRF、请求 ID、超时与错误归一化。当前状态是 `DRAFT_CONTRACT_ADAPTER / MOCK_INTEGRATION_ACCEPTED`；真实环境联调不属于本轮验收要求。

设计理念：契约先行、单一来源、模块边界清晰、传输与业务解耦。

落地路径：契约确认 → Schema/类型 → 端点函数 → 模块接入 → 类型与契约测试。

落地方案：`src/api` 不得导入 `src/modules` 或 `src/components`；跨域共享的传输能力留在 `src/services/http`，用户缓存与权限判断留在 `src/services/auth`。业务 API 默认基址为 `/api`，认证 API 默认基址为空。
