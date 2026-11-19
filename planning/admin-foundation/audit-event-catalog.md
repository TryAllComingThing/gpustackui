# 审计事件目录与 Outbox 验收口径（提案）

- 变更 ID：`admin-foundation/audit`
- 状态：`PROPOSED / SECURITY AND OPERATIONS SIGN-OFF REQUIRED`
- 日期：2026-11-15
- Schema：`audit-event-v1.schema.json`
- 关联：`adr-001-identity-tenant-organization.md`、`organization-api-contract-v0.2.md`、`organization.openapi.yaml`

> 本目录用于消除事件命名和最小字段歧义，不证明审计存储、投递时延或人工补偿责任已签批。

## 1. 机构事件

| 事件名 | 触发点 | 结果 | 必要摘要 |
|---|---|---|---|
| `organization.created` | 非根机构创建成功或失败 | `success/failure/denied` | 父机构、编码、类型、状态 |
| `organization.updated` | 基础资料修改 | `success/failure/denied` | 变更字段、前后摘要 |
| `organization.moved` | 移动成功或失败 | `success/failure/denied` | 源父机构、目标父机构、子树高度 |
| `organization.status_changed` | 停用或启用 | `success/failure/denied` | 原状态、目标状态、原因码 |
| `organization.access_denied` | 缺功能权限或范围外访问 | `denied` | 请求动作、目标类型、策略原因 |

命名规则：

- 启用和停用统一使用 `organization.status_changed`；目标状态写入 `after_summary.status` 或结构化 `reason_code`，不再使用 `activated/deactivated` 作为事件名。
- 授权拒绝事件使用独立可靠安全审计通道；不依赖会因业务事务回滚而消失的业务 Outbox。
- `organization.access_denied` 不得包含范围外资源的名称、编码或存在性信息。

## 2. 其它高风险事件

后续模块冻结时沿用同一命名规则，不得在页面或 API 中自由拼接事件名：

- `user.*`：创建、编辑、启停、调岗、角色分配、凭证重置。
- `role.*`：创建、编辑、权限变更、启停、复制/派生。
- `dictionary.*`：类型和字典项写入。
- `announcement.*`：草稿、计划、发布、撤回、过期。
- `auth.*`：登录成功/失败、SSO 绑定、会话撤销、登出。
- `platform.*`：平台主体管理、目标租户访问和平台审计查询。

具体事件清单必须与对应模块真实 API 同步形成，未登记事件不得用于生产分支。

## 3. Outbox 候选契约

```text
pending
  → publishing
      → delivered
      ↘ retryable_failed → publishing
      ↘ terminal_failed → manual_reconciliation
```

规则：

- 业务事务只写 `pending`；事务提交前不得宣称审计已投递。
- `event_id` 是投递幂等键；重复投递必须被消费者去重。
- `delivered` 记录投递时间和消费者标识。
- `retryable_failed` 必须带可观测重试次数和下一次重试时间。
- `terminal_failed` 必须告警并进入人工补偿队列，禁止静默丢失。
- Outbox 写入失败时业务事务失败关闭。
- 审计查询接口只读；首期不提供修改、删除、导出、归档或合规删除。

## 4. 建议技术默认（待签批）

| 项目 | 候选默认 | 签批方 |
|---|---|---|
| 业务写事务内 Outbox | 必需 | 后端、安全、运维 |
| P95 投递时延 | `≤ 60s` | 后端、运维、合规 |
| 重试退避 | 指数退避，最大 15 分钟，持续 24 小时 | 后端、运维 |
| 终态告警 | `terminal_failed` 5 分钟内告警 | 运维、安全 |
| 人工补偿 SLA | 24 小时内处理 | 安全、合规、运维 |
| 主存储保留 | 首期只保存；具体期限未定义 | 安全、合规、运维 |
| 完整性保护 | 追加写、访问控制、备份/校验由部署确认 | 安全、运维 |

以上为候选值，不是已批准工程默认值。未签批前不得在 UI 宣称满足任何合规保留期限。

## 5. 验收场景

- 业务写成功但 Outbox 写失败：整体回滚，页面不显示成功。
- 重复投递同一 `event_id`：消费者只产生一条审计事实。
- `terminal_failed`：告警可见，查询可定位，人工补偿有责任人。
- 平台操作：`actor_scope=platform`、`target_tenant_id`、`platform_permission` 必填。
- 授权拒绝：使用独立安全通道，且不泄露范围外对象存在性。
- 敏感字段：Token、Cookie、密码、密钥和完整敏感个人信息不进入审计。
