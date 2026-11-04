# src/api

后端契约与领域端点层。它把页面需要的请求、响应 Schema 和领域类型集中在一处；不包含 Vue 组件、页面状态或主题逻辑。

架构：`src/services/http/` 提供通用 Axios、Result 和错误归一化；`src/api/<domain>/` 定义该领域的端点、Schema 和契约类型；`src/modules/<domain>/` 只消费对应 API。

设计思路：端点按业务域集中管理，避免模块之间互相导入 API，也避免页面直接拼装 URL。没有冻结后端契约前，只允许放置 Schema/类型，不虚构请求函数。当前 `auth/` 与 `resources/` 已按 GPUStack 2.x 契约实现。

设计理念：契约先行、单一来源、模块可回滚、传输与业务解耦。

落地路径：契约确认 → Schema/类型 → 端点函数 → 模块接入 → 类型与契约测试。

落地方案：`src/api` 不得导入 `src/modules` 或 `src/components`；跨域共享的传输能力留在 `src/services/http`，用户缓存与权限判断留在 `src/services/auth`。业务 API 默认基址为 `/v2`，认证 API 默认基址为空。
