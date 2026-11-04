# src/services

通用传输、认证存储与统一错误处理；不依赖页面或具体业务域。

架构：`http/` 提供 Axios、Result、API/Auth 基础地址和错误归一化；`auth/` 提供用户缓存与权限判断。认证使用 HttpOnly Cookie，不持久化 token。具体端点与响应 Schema 放在 `src/api/`。
设计思路：统一错误、超时、认证和可观测性；页面通过 `src/api` 消费契约，不重复拼装请求。
设计理念：契约不变、错误可见、最小权限。
落地路径：传输契约 → 客户端实现 → 错误映射 → API 层接入 → 页面验证。
落地方案：不得用 UI 迁移改变 API、权限或认证语义。详见 `docs/architecture/ARCHITECTURE.md` 和 `docs/architecture/AUTH-AND-PERMISSIONS.md`。
