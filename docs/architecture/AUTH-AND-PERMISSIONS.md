# Auth and Permissions

状态：`APPROVED`（契约）/ `OPT-IN`（路由启用）。契约来自 GPUStack 2.x 后端源码与官方 UI，不代表所有业务路由已经启用保护。

## 已冻结契约

- 会话传输：登录成功后由后端写入 HttpOnly Session Cookie；前端不得读取或持久化 token。
- 认证端点：
  - `POST /auth/login`：`application/x-www-form-urlencoded`，字段为 `username`、`password`；成功响应为空并设置 Cookie。
  - `POST /auth/logout`：清除 Cookie，可能返回 `{ logout_url }` 或空响应。
  - `GET /auth/config`：返回 `is_saml`、`is_oidc`、`first_time_setup`、`get_initial_password_command`。
  - `POST /auth/update-password`：JSON `{ current_password, new_password }`。
- 当前用户：`GET /v2/users/me`，响应为 `UserPublic`，关键字段包括 `id`、`username`、`is_admin`、`is_active`、`full_name`、`avatar_url`、`source`、`require_password_change`。
- 权限模型：GPUStack 当前只冻结了 `is_admin` 管理员能力，没有任意字符串权限列表。路由权限 token 仅支持 `authenticated` 与 `admin`；未知 token 必须失败关闭。
- 权限组合：`permissions` 表示全部满足（`every`），不是任一满足。
- `401`：清除本地用户缓存；页面或登录流程负责跳转。
- `403`：进入统一禁止访问页面。

## 当前实现

- `src/api/auth/`：认证配置、登录、登出、修改密码、当前用户 Schema 与请求函数。
- `src/stores/auth.ts`：只缓存当前用户；登录后调用 `/v2/users/me` 刷新真实身份。
- `src/app/router/access.ts`：纯函数判断 `allow`、`login`、`forbidden`。
- `src/app/router/guards.ts`：支持 `requiresAuth`、`requiresAdmin`、`permissions`；可通过 `loginRouteName` 配置登录路由。
- 当前业务路由仍未设置保护元数据，因此现有页面保持可访问；这是显式 opt-in，不是遗漏。

## 启用业务路由前

1. 增加登录页和 `login` 路由，并在 `installAuthGuard` 传入 `loginRouteName`。
2. 在业务路由设置 `requiresAuth`，管理员页面设置 `requiresAdmin: true`。
3. 登录成功后回跳原目标；已登录用户访问登录页时回到默认页。
4. 补充登录、退出、401、403、回跳和权限不足的 unit/E2E 证据。

## 禁止事项

- 不得用本地假登录改变现有权限语义。
- 不得在前端伪造 `permissions` 列表或把 `is_admin` 之外的角色当成已冻结权限。
- 不得在页面层复制 Cookie、用户缓存或权限判断。
- 不得把已类型化元数据当作已启用保护；必须同时有路由元数据和测试证据。
