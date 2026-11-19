# 平台管理员身份载体候选设计

- 变更 ID：`admin-foundation/platform-admin`
- 状态：`PROPOSED / SECURITY AND BACKEND SIGN-OFF REQUIRED`
- 日期：2026-11-15
- 关联决策：`MANUAL-05`、`MANUAL-06`、`ENG-RBAC-01`、`ENG-RBAC-02`
- 结论：用于关闭 `R4-03` 的设计输入，不代表平台身份载体已经批准或实现。

## 1. 要解决的问题

当前文档同时要求：

- `platform_admin` 使用 `platform_all`，可跨租户管理。
- 普通 `UserRoleBinding` 必须带 `tenant_id`。
- 普通租户 API 不接受客户端选择租户。
- 平台管理员必须使用独立 `/platform/*` 能力并产生平台审计。

如果不单独定义平台身份载体，`platform_admin` 要么被错误塞入租户绑定，要么诱导普通 API 接受租户切换，形成隔离绕过。

## 2. 推荐模型

推荐把平台身份和租户业务身份分成两个授权平面：

```text
PlatformPrincipal
  id
  status
  version
  created_at
  updated_at

PlatformIdentityBinding
  principal_id
  issuer
  subject_type
  subject_value
  status
  version

PlatformRoleBinding
  principal_id
  role_key = platform_admin
  scope_type = platform_all
```

平台主体不保存普通租户角色绑定。普通 `UserRoleBinding` 继续只服务当前租户，不承载 `platform_all`。

### 2.1 身份来源

首期优先使用 IdP 中的独立平台管理员组或受控本地破窗身份：

- IdP 方案：显式 group/claim 映射到 `platform_admin`，禁止按邮箱、用户名或组织名推断。
- 本地破窗方案：仅受控内网 + MFA；不用于日常业务操作；高风险操作必须审计。
- 平台身份绑定必须记录 `issuer + subject_type + subject_value`，缺失或冲突失败关闭。

### 2.2 会话与入口

- 平台管理员通过独立 `/platform/*` 路由树进入。
- 平台会话必须带有可验证的 `actor_scope = platform`。
- 平台 API 不接受 `X-Tenant-Id`、`tenant_id` 查询参数或通用请求体字段来决定跨租户上下文。
- 目标租户必须是具体平台资源路径或经 Schema 约束的请求体字段，例如未来 `POST /platform/tenants/{tenant_id}/...`。
- 普通 `/organizations`、`/users` 等租户 API 即使由平台管理员调用，也不自动绕过租户约束；平台入口必须使用独立 API。
- 用户从平台入口离开时，前端必须清除平台上下文，不得把 `platform_all` 带入普通导航。

### 2.3 权限判定

平台侧权限目录与租户权限目录分开：

```text
platform:tenant:read
platform:tenant:manage
platform:audit:read
platform:administrator:manage
```

规则：

- `platform_all` 只在平台 API 的授权判定中生效。
- 平台管理员没有隐式租户业务权限；需要操作目标租户业务资源时，必须通过平台 API 的显式能力完成。
- 平台权限不得由普通租户角色分配界面授予或撤销。
- 平台身份和租户业务身份同时存在时，前端必须在会话中区分两个上下文，不能合并成 `is_admin`。

### 2.4 平台审计

平台审计事件必须包含：

- `actor_scope = platform`
- `actor_id = platform_principal_id`
- `target_tenant_id`
- `platform_permission`
- `request_id`
- `result`
- `reason_code`
- 目标资源类型和 ID

平台审计使用独立可靠安全通道；不能依赖普通租户业务 Outbox 的回滚行为掩盖拒绝或跨租户访问尝试。

## 3. 最后平台管理员保护

- 平台管理员保护作用域与租户管理员完全分离。
- 至少保留一个有效 `platform_admin`；停用、解绑或撤销角色必须在同一事务内检查。
- 保护锁使用全局平台保护记录或等价串行化机制，不使用租户级锁。
- 最后管理员操作失败必须审计，不能只返回前端提示。
- 平台主体初始化必须通过受控部署流程，不提供普通租户 API 自举入口。

## 4. 与普通租户的隔离验收

必须覆盖：

| 场景 | 期望 |
|---|---|
| 平台管理员调用 `/organizations` 并携带目标租户参数 | 拒绝；普通 API 不接受客户端切换租户 |
| 平台管理员调用独立 `/platform/*` 目标租户资源 | 按平台权限与目标租户绑定允许 |
| 租户管理员尝试授予 `platform_admin` | 拒绝并审计 |
| 普通 `UserRoleBinding` 包含 `platform_all` | Schema 或后端校验拒绝 |
| 平台会话进入普通租户导航 | 清除平台上下文或进入明确禁止页 |
| 并发移除最后平台管理员 | 一个成功，另一个失败关闭 |
| 平台管理员操作租户资源 | 产生 `actor_scope=platform` 和 `target_tenant_id` 审计 |

## 5. 待签批问题

- [ ] 平台管理员首期来自企业 IdP group，还是允许本地破窗平台账号？
- [ ] 平台主体与租户业务用户是否允许同一自然人同时拥有两种身份？如果允许，如何避免会话上下文混淆？
- [ ] 平台 API 的目标租户如何表达：路径参数、受控请求体，还是平台资源 ID？
- [ ] 平台会话是否独立登录入口，还是同一 Session 内通过后端签发 `actor_scope`？
- [ ] 平台审计存储、权限和保留责任归属哪个团队？
- [ ] 最后平台管理员保护使用全局行锁、可串行化事务还是数据库约束？

以上问题关闭前，`R4-03` 保持 `BLOCKED`。本设计可以作为后端、安全、运维和前端联签会议的输入。
