# 前端 RBAC 集成契约提案

- 变更 ID：`admin-foundation/frontend-rbac`
- 状态：`PROPOSED / BACKEND CONTRACT REQUIRED`
- 日期：2026-11-15
- 关联：`role-permission-matrix.md`、`adr-001-identity-tenant-organization.md`、`organization-slice-l3-task.md`
- 目的：关闭 `R4-08` 的设计歧义，约束后续 L3 实现；本文不是后端端点事实，也不授权修改源码。

## 1. 当前事实

- `src/services/auth/permissions.ts` 只定义 `authenticated` 和 `admin`。
- `src/types/auth.ts` 的 `AuthUser` 只有 `is_admin`，没有租户、权限键或数据范围。
- `src/app/router/access.ts` 只支持 `requiresAuth`、`requiresAdmin` 和固定 token 的 `permissions`。
- 当前 guard 对未知权限 token 失败关闭，这是必须保留的安全属性。

## 2. 推荐后端返回模型

后端必须选择并冻结一种方式；不得由前端自行扩展 `/api/users/me` 字段或伪造权限。

### 方案 A：扩展当前会话能力（优先评估）

在服务端确认的当前用户响应中增加独立版本化对象：

```json
{
  "id": "user_01",
  "tenant": {
    "id": "tenant_01",
    "name": "示例租户"
  },
  "authorization": {
    "permissions_version": 12,
    "permission_keys": [
      "iam:organization:read",
      "iam:organization:create"
    ],
    "delegable_permission_keys": [
      "iam:organization:read"
    ]
  }
}
```

要求：

- `permission_keys` 只包含后端确认后的稳定权限码。
- 数据范围不返回给前端作为授权依据；页面通过 API 结果和动作可用性展示。
- `delegable_permission_keys` 只用于权限矩阵提示，最终授权仍由后端校验。
- 权限版本变化后必须能重新确认会话或返回明确的刷新信号；不得长期使用旧快照。
- 未知字段策略由后端契约决定；缺失 `authorization` 时管理路由失败关闭，不能回退到 `is_admin`。

### 方案 B：独立能力端点

新增独立能力确认端点，例如由后端确认的 `/api/users/me/capabilities`。该路径必须由真实 OpenAPI 定义，前端不得先创建请求函数。

若采用方案 B：

- 会话确认与能力确认必须共享同一 `session_version`。
- 能力请求失败时管理路由失败关闭；普通个人资料页可按后端契约降级。
- 能力响应必须显式包含 `tenant_id` 和 `permissions_version`。
- 不允许通过菜单接口、角色名或前端常量推导能力。

当前推荐：优先方案 A，减少一次会话确认请求；若后端认为权限包过大或变更频繁，再选择方案 B。

## 3. 前端消费规则

后续 L3 变更应满足：

```text
route requiresAuth = true
route permissions = ['iam:organization:read']
route permissionMode = 'all'   // 首期默认 all；any 需单独定义
```

规则：

- 路由和菜单使用权限码，不使用角色名。
- `permissions` 仍表示全部满足；需要任一满足时必须新增显式 `permissionMode`，不能在页面自行解释。
- 未知权限码或未知 `permissionMode` 失败关闭。
- 菜单隐藏、按钮禁用和路由 guard 都不是后端授权替代品。
- 数据范围由后端按动作和对象计算；前端不得拿 `scope` 参数扩大范围。
- 个人资料和修改密码继续使用认证契约，不混入管理端 `iam:user:*`。
- `is_admin` 仅保留现有兼容语义，不得自动映射为任意新管理权限。
- 平台入口 `platform_all` 与普通租户权限上下文分开，不在同一路由元数据中混用。

## 4. 迁移步骤

1. 后端冻结能力返回 Schema、权限目录、未知权限码策略和权限版本刷新语义。
2. 前端新增 `Authorization` Schema，拒绝缺失、类型错误或未知权限版本结构。
3. 扩展 `AuthPermission` 时保留 `authenticated/admin` 兼容 token，并增加失败关闭测试。
4. 更新 `RouteAccessMeta`、`route-meta.d.ts`、guard 和导航可见性。
5. 增加 `permissionMode` 测试；首期只允许 `all`，`any` 在真实复用出现后再开放。
6. 接入机构切片页面；写操作仍逐动作检查，不只看页面读权限。
7. 同步 `docs/architecture/AUTH-AND-PERMISSIONS.md`、API 契约、i18n 和测试。

## 5. 必须新增的测试

- 有 `iam:organization:read` → 机构路由允许。
- 无读权限但已认证 → `403`。
- 未知权限 token → 失败关闭。
- `permissions` 数组为 `all` 语义；缺失或类型错误 → 失败关闭。
- 管理路由缺少访问元数据 → 登录或不放行，绝不静默公开。
- `is_admin=true` 但无新权限键 → 不得访问 RBAC 管理页。
- 权限版本变化 → 旧能力快照被刷新或以失败关闭方式阻断。
- 平台上下文与租户上下文互不污染。

## 6. 关闭 `R4-08` 的交付物

- 后端真实 OpenAPI 中的能力响应 Schema 与权限目录。
- 前端 L3 任务批准。
- `typecheck`、`lint`、unit、integration、E2E、accessibility 和 build 结果。
- 失败关闭、未知 token、权限刷新和平台/租户隔离测试。
