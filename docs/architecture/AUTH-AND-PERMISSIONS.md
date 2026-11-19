# Auth and Permissions

认证契约来自 GPUStack 2.x 后端源码与官方 UI。前端路由守卫不是安全边界，后端必须独立执行认证与授权。

## 认证契约

- 会话传输：登录成功后由后端写入 HttpOnly Session Cookie；前端不得读取或持久化 token。
- 认证端点：
  - `POST /auth/login`：`application/x-www-form-urlencoded`，字段为 `username`、`password`；成功响应为空并设置 Cookie。
  - `POST /auth/logout`：清除 Cookie，可能返回 `{ logout_url }` 或空响应。`logout_url` 仅在 HTTPS、无凭据且 origin 命中显式 `VITE_TRUSTED_LOGOUT_ORIGINS` 白名单时允许跳转；其它值只回到站内登录页。
  - `GET /auth/config`：返回 `is_saml`、`is_oidc`、`first_time_setup`、`get_initial_password_command`。
  - `POST /auth/update-password`：JSON `{ current_password, new_password }`。
- 当前用户：`GET /api/users/me`，响应为 `UserPublic`，关键字段包括 `id`、`username`、`is_admin`、`is_active`、`full_name`、`avatar_url`、`source`、`require_password_change`。`is_active` 与 `require_password_change` 是必填布尔字段；缺失、类型错误、`is_active !== true` 或 `require_password_change === true` 一律失败关闭。
- 权限模型：当前只定义 `is_admin` 管理员能力，没有任意字符串权限列表。路由权限 token 仅支持 `authenticated` 与 `admin`；未知 token 必须失败关闭。
- 权限组合：`permissions` 表示全部满足（`every`），不是任一满足。
- `401`：清除本地用户状态并跳转登录；登录接口自身的 `401` 只显示凭据错误，不触发会话跳转。
- `403`：进入统一禁止访问页面。
- 会话确认遇到网络错误、超时或非 `401/403` 服务端错误：进入 `/unavailable`，不得降级为已认证或匿名放行。
- 退出成功：清除本地状态并回登录页；存在可信 `logout_url` 时跳转外部 SSO 退出地址。
- 退出返回 `401`：视为服务端会话已失效，清除本地状态并回登录页，不显示通用退出失败。
- 退出返回 `403`、网络错误或其它服务端错误：保留当前已确认身份，在当前页显示退出失败，不得伪造为已退出。

## 当前实现

- `src/api/auth/`：认证配置、登录、登出、修改密码、当前用户 Schema 与请求函数。
- `src/services/auth/session.ts`：只通过 `GET /api/users/me` 做服务端会话确认；单飞（single-flight）合并并发确认。启动时删除旧版 `gpustack-auth-user` localStorage 缓存，不再将其视为认证来源。`ensureSession()` 与强制 `refresh()` 都复用同一 pending 请求；登录、退出等认证状态切换会使旧探测失效，避免旧响应覆盖新状态或让新状态卡在旧请求上。
- `src/stores/auth.ts`：显式状态机 `unknown → checking → authenticated | anonymous | unavailable`。仅服务端确认成功后才进入 `authenticated`；网络或服务异常进入 `unavailable`；本地无用户缓存恢复。
- `src/app/router/access.ts`：纯函数判断 `allow`、`login`、`forbidden`。
- `src/app/router/guards.ts`：统一保护 `requiresAuth`、`requiresAdmin`、`permissions`；未确认会话时先执行服务端确认，再决定放行、登录回跳、禁止访问或服务不可用。缺少任何访问元数据的路由失败关闭到登录页，不得静默视为公开路由。`guestOnly` 登录页对已登录用户回到默认页。
- `src/app/router/redirect.ts`：登录回跳只接受站内绝对路径，拒绝协议相对地址、反斜杠、控制字符和登录/403 目标。
- `src/app/pages/LoginPage.vue`：用户名/密码登录、错误提示、提交中状态和回跳；挂载时读取 `/auth/config`，后端报告 SAML/OIDC 可用时展示 SSO 入口。`VITE_SSO_LOGIN_URL` 为空时明确提示未配置，不虚构登录端点。
- `src/app/pages/PasswordChangePage.vue`：通过 `POST /auth/update-password` 修改当前账号密码；成功后尝试服务端登出并回登录页。若登出未能确认，保留“密码已更新”结果并提示当前会话可能仍有效，不得宣称已安全退出。
- `src/app/pages/ServiceUnavailablePage.vue`：重试时调用 `auth.refresh()`；成功回原目标，`401` 回登录，`403` 回禁止页，网络/服务错误留在 `/unavailable`，回跳参数复用同一站内路径校验。
- `src/services/auth/session-events.ts`：统一 `401/403` 导航事件；并发 `401` 只产生一次重定向。
- `src/services/http/client.ts`：`401` 通知清理会话并回登录；`403` 进入禁止访问页；登录、`/api/users/me` 探测与退出请求不触发全局跳转，退出结果由认证状态机与 Header 显式处理，避免重定向循环。
- `src/services/http/csrf.ts`：状态变更请求发送 CSRF Cookie→Header。浏览器生产构建始终要求配置 `VITE_CSRF_COOKIE_NAME` 且 Cookie 存在；缺失配置或 Cookie 时在发送请求前失败关闭，`VITE_CSRF_REQUIRED=false` 只在非生产构建生效。
- `src/api/auth/auth.ts`：CSRF 必需且尚无可见 Token 时，登录前通过安全的 `GET /auth/config` 引导后端设置 Cookie；引导后仍无 Token 时以 `CSRF` 错误阻断登录，不发送用户名和密码。
- 所有业务路由已设置 `requiresAuth`；管理员专用页面按契约设置 `requiresAdmin: true`。

## 登录与会话流程

1. 访问受保护路由时，guard 检查 `auth.status`。
2. `unknown`/`checking` 状态下调用 `ensureSession()`；并发调用共享同一个 `/api/users/me` 请求。
3. 服务端确认成功：写入用户与 `authenticated`，继续目标路由。
4. `401`：清除用户状态，跳转 `/login?redirect=<原目标>`；回跳目标经过白名单校验。
5. `403`：保留已确认的用户身份，进入 `/403`，不得误判为未登录。
6. 网络错误、超时或非预期服务端错误：即使已有先前确认的用户，也清除不可信用户状态并进入 `/unavailable`，不得继续以 `authenticated` 放行。
7. 登录前 CSRF 必需时：先确认可见 Token；缺失则调用 `GET /auth/config` 引导，仍缺失则阻断登录。
8. 退出：调用 `/auth/logout`。成功或 `401` 清除本地状态并回登录；可信 SSO URL 可跳转；`403`/网络/服务错误保留当前身份并显示失败。
9. 修改密码：提交当前密码与新密码；成功后先调用 `/auth/logout`。登出成功回到登录页，`401` 视为会话已失效并清理本地状态；其它错误保留当前页面并显示“密码已更新但退出未确认”。

## 相关源码与测试

- 集成测试：`tests/integration/auth/auth-store.spec.ts`、`tests/integration/auth/guard.spec.ts`。
- E2E：`tests/e2e/auth/auth.e2e.ts`，使用 Playwright 路由 mock。
- 单元测试：`tests/unit/{auth-api,auth-contract,logout-redirect,redirect,csrf,session-events,http-errors}.spec.ts`。

## 禁止事项

- 不得用本地假登录改变现有权限语义。
- 不得在前端伪造 `permissions` 列表或把 `is_admin` 之外的角色当成已定义权限。
- 不得在页面层复制 Cookie、用户缓存或权限判断。
- 不得把前端路由保护当作安全边界；后端必须独立执行认证与授权，并执行 Origin/SameSite/CSRF 校验。
- 不得在 CSRF 配置或 Cookie 缺失时继续发送生产状态变更请求。
- 不得恢复以 localStorage 用户对象直接初始化 `authenticated` 的实现。
