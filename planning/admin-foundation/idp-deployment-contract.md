# IdP 与身份生命周期部署契约（待签批模板）

- 变更 ID：`admin-foundation/idp`
- 状态：`TEMPLATE / SECURITY IT OPERATIONS BACKEND SIGN-OFF REQUIRED`
- 日期：2026-11-15
- 关联决策：`MANUAL-01`、`MANUAL-02`、`MANUAL-03`、`ENG-AUTH-01` 至 `ENG-AUTH-05`
- 用途：把 `R4-05` 的开放式问题收敛为可签批的部署契约；空白项不得进入实现。

## 1. 企业 IdP 选择

| 项目 | 必填值 | 当前状态 |
|---|---|---|
| 企业是否已有可用 IdP | 是 / 否 / 不确定 | `TBD` |
| IdP 产品与版本 | 例如 Microsoft Entra ID、Keycloak、Okta | `TBD` |
| 租户/领域标识 | `tenant_id` 或 realm | `TBD` |
| 环境 | dev / staging / production | `TBD` |
| 运维责任团队 | 名称与联系人 | `TBD` |
| 备份、升级、监控和故障恢复 | 责任与 SLA | `TBD` |

若企业无可用 IdP，采用产品已批准的工程默认 Keycloak；Keycloak 部署、升级、备份和监控责任仍须运维签批。

## 2. OIDC 参数

| 参数 | 要求 | 当前值 |
|---|---|---|
| 协议 | Authorization Code + PKCE | 已确认方向 |
| issuer | 精确 HTTPS issuer，禁止通配 | `TBD` |
| client_id | 后端/BFF 专用客户端 | `TBD` |
| client_secret 管理 | Secret Manager 或等价机制 | `TBD` |
| redirect_uri | 精确注册，禁止开放重定向 | `TBD` |
| post_logout_redirect_uri | 精确白名单 | `TBD` |
| audience | API audience | `TBD` |
| 签名算法 | 允许算法白名单 | `TBD` |
| clock skew | 最大允许偏差 | `TBD` |
| state/nonce | 服务端生成、一次性校验 | 必须 |
| Token 交换和校验 | 后端/BFF 完成 | 已确认方向 |
| 浏览器 Token | 不持有长期 ID/Access/Refresh Token | 已确认方向 |

拒绝：

- 以邮箱、用户名、显示名或手机号自动绑定。
- 在浏览器持久化长期 Token。
- 接受未校验 issuer/audience/signature 的声明。
- 并行维护多套主认证链路。

## 3. 声明与身份绑定

稳定绑定键：

```text
tenant_id + issuer + subject_type + subject_value
```

| 项目 | 要求 | 当前值 |
|---|---|---|
| Entra subject | `iss + oid`，并校验 `tid` 映射 | `TBD` |
| 通用 OIDC subject | `iss + sub` | `TBD` |
| 姓名/邮箱用途 | 仅展示，不作为绑定键 | 必须 |
| 声明缺失/冲突 | 失败关闭 | 必须 |
| IdP group 到平台/租户角色映射 | 显式、可审计、可撤销；禁止组织名/域名隐藏例外 | `TBD` |

## 4. 邀请后绑定（不开放 JIT）

| 项目 | 推荐默认 | 签批方 |
|---|---|---|
| 邀请有效期 | 72 小时，一次性 | 产品、安全、IT |
| 默认机构 | 发起邀请时显式选择，不使用系统默认根机构 | 产品、后端 |
| 默认角色 | 无管理权限；必要时仅 `standard_user` | 产品、安全 |
| 邀请撤销 | 管理员可撤销，撤销后旧链接失败关闭 | 后端、安全 |
| 首次登录 | 仅绑定到明确业务用户；不自动创建用户 | 后端、安全 |
| 重复绑定 | 拒绝并审计 | 后端、安全 |

若后续启用 JIT，必须另行形成决策与 Schema；首期不得实现半成品 JIT 路径。

## 5. 会话撤销与退出

| 场景 | 要求 | 当前值 |
|---|---|---|
| 请求认证 | 服务端确认，前端不持久化 Token | 已确认 |
| 用户停用 | 递增 `session_version`，旧会话返回 `401` | `TBD` 存储方案 |
| 密码重置/强制改密 | 递增 `session_version` | `TBD` |
| 身份解绑 | 递增 `session_version` | `TBD` |
| 权限变化 | 递增 `permissions_version`，不必强制退出 | `TBD` |
| 本地退出 | 优先撤销服务端 Session | 已确认方向 |
| IdP 退出 | RP-Initiated Logout / Back-Channel Logout 作为补充 | `TBD` |
| 最大会话分叉时延 | 明确分钟数或可观测上限 | `TBD` |
| 授权缓存故障 | 失败关闭，不使用过期权限 | 必须 |

## 6. 破窗账号

产品已确认首期仅要求受控内网 + MFA，不再要求额外凭证库、轮换或告警控制。首期硬门禁只有以下两项：

- [ ] 网络访问仅来自受控内网或受控运维路径。
- [ ] MFA 实际强制执行，不是可选提示。

以下为既有审计/运维责任或建议，不构成新增产品控制，也不得扩大 `MANUAL-03` 的产品范围：

- 破窗账号不用于日常业务操作。
- 账号创建、停用和恢复流程记录责任人。
- 高风险操作沿用既有审计要求；审计失败关闭。
- 平台管理员和租户管理员是否共享破窗账号由安全/运维在部署评审中记录，不作为首期产品硬门禁。
- 紧急禁用后的 Session 失效按既有会话撤销语义验证，不新增破窗专属控制。

## 7. 部署与运维验收

- [ ] 开发、预发布和生产 issuer/client 分离。
- [ ] Secret 不进入仓库、前端包或日志。
- [ ] 回调域名与 Cookie 作用域经过安全确认。
- [ ] CSRF、SameSite、Origin 校验与现有认证契约一致。
- [ ] IdP 不可用时进入明确的不可用状态，不降级为匿名或弱认证。
- [ ] IdP 停用/删除账号的同步策略和最大传播时延明确。
- [ ] 日志包含 `request_id`，但不含 Token、Cookie、密码或完整敏感个人信息。
- 可选观测项：登录失败、回调失败、Token 校验失败、会话撤销延迟和破窗登录监控；是否纳入部署由安全/运维决定，不作为首期新增硬门禁。

## 8. 关闭 `R4-05` 的交付物

1. 填写的本模板，空白项清零。
2. 由 IT/运维、安全、后端和前端签字的部署拓扑与责任矩阵。
3. 真实 issuer、回调、Cookie 作用域和退出配置。
4. 邀请绑定、会话撤销、破窗和 IdP 故障的测试用例。
5. 至少一次 staging 端到端验证记录；仅文档签批不能替代验证。
