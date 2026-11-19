# 管理平台基础规划评审清单 v0.2

- 变更 ID：`admin-foundation`
- 文档状态：`PROPOSED / R5 CONTRACT ADAPTER SYNC`
- 评审状态：`ALL PRODUCT DECISIONS CONFIRMED / TECHNICAL GATES PENDING`
- 开发授权：`CONTRACT ADAPTER ONLY / PRODUCTION DENIED`
- 执行修订：R4.1（2026-11-15）
- 日期：2026-11-15
- 用途：把能力地图、角色权限矩阵、身份/租户/组织 ADR、机构 API 契约和交互参考收束为可评审、可签收的开发前门槛。
- 唯一决策源：`decision-log.md`

> 除 R5 条件放行的 `src/api/organizations/**`、HTTP 错误映射和单测外，不进入 `src/**` 实现，不创建机构页面、路由或 RBAC 扩展，不修改认证或后端契约。清单中的“已确认”必须能追溯到 `decision-log.md` 的决策 ID；后端真实 OpenAPI、技术签批和实现验证完成前，不得解释为整体签收。

> 当前最短推进路径、G1 后端交接清单和 G2/G3 联签决策包见 `shortest-path-execution.md`。门禁顺序为 G1 → G2/G3 → G4 → G5，未满足时任一项保持 `DENIED`。

## 1. 推荐评审顺序

```text
ADR-001 身份/租户/组织边界
→ 角色权限矩阵 v0.2
→ 机构 API v0.2 提案 + 后端真实 OpenAPI 3.1
→ 交互与原型评审
→ 形成机构垂直切片任务契约
→ 另行授权开发
```

先评审 ADR 是因为租户、机构、身份和 RBAC 会决定 API 和页面；如果先冻结页面，容易产生错误字段和假权限。

## 2. 产品经理已确认方向

产品经理小张于 2026-11-15 批准以下产品方向及工程默认值，证据为 `EVID-2026-11-15-PM-01`、`EVID-2026-11-15-PM-02`。状态以 `decision-log.md` 为准；产品批准不替代后端、安全、运维和前端技术签批。

| 检查项 | 结论/证据 | 决策 ID | 状态 |
|---|---|---|---|
| 平台采用多租户模型 | ADR 2.2、机构 API 字段和权限矩阵均包含 `tenant_id` | `DEC-TENANT-01` | `CONFIRMED` |
| `tenant_id` 是查询、权限、索引和审计硬边界 | ADR 2.2、2.10；API 约定服务端注入 | `DEC-TENANT-02` | `CONFIRMED` |
| 机构是组织/部门树，不与租户合并 | ADR 2.3；API 资源仅包含机构层 | `DEC-ORG-02` | `CONFIRMED` |
| 每租户一个根机构，最大深度 4 级 | ADR 2.3；API 5.1；OpenAPI `depth` 上限 4 | `DEC-ORG-01` | `CONFIRMED` |
| 用户当前仅属于一个机构 | ADR 2.3；交互 5.2 禁止多机构编辑器 | `DEC-USER-01` | `CONFIRMED` |
| 外部身份使用 `issuer + subject` 绑定 | ADR 2.4；Entra 使用 `iss + oid` 并校验 `tid` | `DEC-AUTH-01/02` | `CONFIRMED` |
| 允许受控本地管理员破窗登录 | ADR 2.6；网络仅受控内网且必须 MFA，其他附加控制不作首期要求 | `DEC-AUTH-03` | `CONFIRMED` |
| 采用 RBAC 功能权限 + 四种标准数据范围 | ADR 2.7；权限矩阵第 1、5、7 节 | `DEC-RBAC-01` | `CONFIRMED` |
| 内置角色不可编辑、不可删除 | ADR 2.8；权限矩阵第 3 节 | `DEC-RBAC-02` | `CONFIRMED` |
| 防提权覆盖用户、角色、机构和复制/派生 | ADR 2.8/3；权限矩阵第 8 节 | `DEC-RBAC-03` | `CONFIRMED` |
| 最后管理员保护必须事务级原子 | ADR 2.8/3；权限矩阵第 9 节 | `DEC-RBAC-04` | `CONFIRMED` |
| `401/403/404` 语义统一 | ADR 2.11；权限矩阵第 10 节；API 第 5/6 节 | `DEC-ERR-01` | `CONFIRMED` |
| 菜单、按钮、路由和 API 不写死角色名 | ADR 2.1；权限矩阵第 11 节；交互第 2 节 | `DEC-UI-01` | `CONFIRMED` |
| 机构采用树表格，拖拽仅增强 | 交互 5.1；ADR/API 要求移动主路径 | `DEC-UI-02` | `CONFIRMED` |
| 用户编辑使用 Drawer，资料和授权分区提交 | 交互 5.2 | `DEC-UI-03` | `CONFIRMED` |
| 权限矩阵独立工作区并有变更摘要 | 交互 5.3 | `DEC-UI-04` | `CONFIRMED` |
| 公告草稿与预览快照分离 | 交互 5.5 | `DEC-UI-05` | `CONFIRMED` |
| 审计严格只读，首期仅保存 | ADR 2.10；交互 5.6；权限矩阵 | `DEC-AUDIT-01` | `CONFIRMED` |
| 页面覆盖 8 类状态和稳定业务错误码映射 | 交互第 4 节；页面契约矩阵第 3 节 | `DEC-UI-06` | `CONFIRMED` |
| 复杂页面先完成 HTML 原型 | 交互第 6 节 | `DEC-UI-07` | `CONFIRMED` |

## 3. 人工决策关闭记录

| ID | 确认结论 | 当前状态 | 决策人/日期 | 证据 | 剩余门禁 |
|---|---|---|---|---|---|
| `MANUAL-01` | 首期必须接入 IdP；优先企业现有 IdP，否则 Keycloak | `CONFIRMED` | 产品经理小张 / 2026-11-15 | `EVID-2026-11-15-PM-01` | SSO 回调、Token 交换、绑定和运维由技术负责人冻结 |
| `MANUAL-02` | 不开放 JIT，仅邀请后绑定 | `CONFIRMED` | 产品经理小张 / 2026-11-15 | `EVID-2026-11-15-PM-01` | 邀请有效期、默认机构和默认角色待安全/IT 确认 |
| `MANUAL-03` | 仅受控内网 + MFA；其他附加控制不作首期要求 | `CONFIRMED` | 产品经理小张 / 2026-11-15 | `EVID-2026-11-15-PM-02` | 安全/运维按已确认边界完成技术签批 |
| `MANUAL-04` | 开发租户自助管理并启用 `tenant_admin`；仅限当前租户 | `CONFIRMED` | 产品经理小张 / 2026-11-15 | `EVID-2026-11-15-PM-02` | 后端/安全冻结租户级角色、授权范围和最后管理员保护 |
| `MANUAL-05` | 独立 `/platform/*`，不使用普通请求头切换租户 | `CONFIRMED` | 产品经理小张 / 2026-11-15 | `EVID-2026-11-15-PM-01` | 平台身份载体和审计字段待技术签批 |
| `MANUAL-06` | 内置模板实例化到租户，自定义角色租户级 | `CONFIRMED` | 产品经理小张 / 2026-11-15 | `EVID-2026-11-15-PM-01` | 模板版本、实例化和迁移规则待后端确认 |
| `MANUAL-07` | RBAC 功能权限 + `self/org/org_subtree/all` 四种标准范围；`custom` 延后 | `CONFIRMED` | 产品经理小张 / 2026-11-15 | `EVID-2026-11-15-PM-01` | 范围 Schema、索引和防提权测试待后端确认 |
| `MANUAL-08` | 首期只停用与启用，不提供删除或恢复 | `CONFIRMED` | 产品经理小张 / 2026-11-15 | `EVID-2026-11-15-PM-01` | 停用约束和引用保留待后端/合规确认 |
| `MANUAL-09` | 首期仅保存；不开放导出、归档或合规删除 | `CONFIRMED` | 产品经理小张 / 2026-11-15 | `EVID-2026-11-15-PM-01` | 存储容量、完整性保护和失败关闭待安全/运维确认 |
| `MANUAL-10` | 受众规则可组合；已发布内容不可原地修改 | `CONFIRMED` | 产品经理小张 / 2026-11-15 | `EVID-2026-11-15-PM-01` | 组合规则和发布后版本化方式待后端确认 |
| `MANUAL-11` | 首期页面私有，出现第二个真实复用后公共化 | `CONFIRMED` | 产品经理小张 / 2026-11-15 | `EVID-2026-11-15-PM-01` | 实现任务记录复用检索和边界 |
| `MANUAL-12` | 原型采用 HTML；其他签收与证据不作首期要求 | `CONFIRMED` | 产品经理小张 / 2026-11-15 | `EVID-2026-11-15-PM-02` | 直接进入 HTML 原型和实现评审；代码级可访问性验收仍保留 |

## 4. 文档门禁状态

| 文档 | 当前状态 | 是否可签收 | 仍需处理 |
|---|---|---|---|
| `decision-log.md` | `DRAFT / ALL MANUAL DECISIONS CONFIRMED` | 否 | 技术签批和后端 OpenAPI |
| `adr-001-identity-tenant-organization.md` | `PROPOSED / ALL PRODUCT DECISIONS CONFIRMED` | 否 | 安全/运维/后端/前端技术签收 |
| `role-permission-matrix.md` | `PROPOSED / PRODUCT DECISIONS CONFIRMED` | 否 | 后端确认权限码、事务不变量和测试映射 |
| `organization-api-contract-v0.2.md` | `PROPOSED / CONTRACT CANDIDATE / ALL PRODUCT DECISIONS CONFIRMED` | 否 | 后端真实 OpenAPI、OpenAPI lint、Schema 校验和跨角色签收 |
| `organization.openapi.yaml` | `PROPOSED / BACKEND OPENAPI REQUIRED` | 否 | 后端补充真实 OpenAPI 并完成差异审查 |
| `organization.backend-openapi.yaml` | `DRAFT / BACKEND RECONCILIATION REQUIRED` | 否 | 后端补全真实拓扑和实现语义，完成 lint、示例校验和差异关闭 |
| `interaction-and-reference.md` | `PROPOSED / ALL PRODUCT DECISIONS CONFIRMED` | 否 | HTML 原型评审、代码级键盘和窄屏验收 |
| `page-contract-matrix.md` | `PROPOSED / R4.1 DECISION SYNC` | 否 | 确认页面访问对象、后端 API 契约和组件方案 |
| `organization-slice-l3-task.md` | `CONDITIONAL GO / CONTRACT ADAPTER IMPLEMENTED / PRODUCTION SLICE BLOCKED` | 仅契约层 | 真实契约、G1-G4 关闭、测试命令复核和最终批准 |
| `platform-admin-identity-proposal.md` | `PROPOSED / SECURITY+BACKEND SIGN-OFF REQUIRED` | 否 | 平台身份来源、目标租户表达、会话上下文和审计责任 |
| `frontend-rbac-contract-proposal.md` | `PROPOSED / BACKEND CONTRACT REQUIRED` | 否 | 后端能力响应 Schema、权限目录和权限刷新语义 |
| `idp-deployment-contract.md` | `PROPOSED / TBD / SECURITY+IT SIGN-OFF REQUIRED` | 否 | 企业 IdP、issuer、回调、声明映射、会话撤销和破窗部署 |
| `audit-event-v1.schema.json` | `PROPOSED / SIGN-OFF REQUIRED` | 否 | 2020-12 验证、存储、投递时延和补偿责任 |
| `audit-event-catalog.md` | `PROPOSED / SIGN-OFF REQUIRED` | 否 | Outbox 实现、告警、人工补偿和合规保留 |
| `prototypes/admin-foundation/` | `HTML PROTOTYPE / AUTOMATED VERIFICATION PASSED` | 部分 | 进入实现评审并记录结论；不额外要求多角色签收、版本号或证据包 |
| `prototype-implementation-review.md` | `AUTOMATED PASS / OWNER CONFIRMATION PENDING` | 部分 | 实现评审负责人确认记录；实现后代码级可访问性验收 |
| `capability-map.md` | `PROPOSED / ALL PRODUCT DECISIONS CONFIRMED` | 否 | 技术契约与后端 API |
| `review-report-2026-11-14-r2.md` | `REVIEWED / NOT APPROVED` | 历史证据 | 保留为 R2 结论，不替代当前签收 |
| `review-report-2026-11-14-r3.md` | `REVIEWED / NOT APPROVED` | 历史证据 | 保留为 R3 五类专家结论，不替代人工签批 |

## 5. 机构 API 与 OpenAPI 检查

| 检查项 | 结论 | 状态 |
|---|---|---|
| 后端是否提供真实 OpenAPI 或等价 Schema | 当前只有规划提案，后端尚未确认 | 阻塞 |
| OpenAPI 3.1 联合评审提案完整性 | 路径、Schema、成功/错误示例、稳定错误码及权限/幂等/审计元数据已补齐；本地引用机检通过 | 已完成（提案层） |
| 端点、方法、状态码和错误码是否确认 | v0.2 候选已定义，等待后端确认 | 阻塞 |
| `tenant_id`、`id`、`code`、`parent_id`、`type`、`status`、`version` 类型 | 已写入 API 和 OpenAPI | 已完成 |
| 外部 ID 是否统一不透明字符串 | 是；后端内部可使用 UUIDv7 | 已完成 |
| `code_normalized` 与 `(tenant_id, code_normalized)` 唯一 | 已写入 API 2.1/5.1 | 已完成 |
| 单根、四级、循环检测和事务锁 | 已补充统一结构锁、根节点不变量和并发测试要求 | 部分完成，待后端确认 |
| `active/inactive` 状态统一 | 已写入 API 和 OpenAPI | 已完成 |
| `ETag/If-Match`：`428/412/409` | 已写入 API 和 OpenAPI；错误码已枚举 | 部分完成，待真实契约校验 |
| `Idempotency-Key` 语义 | 已增加 lookup key、指纹、状态机、并发和重放规则 | 部分完成，待后端确认存储与 TTL |
| 写操作审计和 Outbox 失败关闭 | 已统一事件名并新增 `audit_event_v1` Schema、事件目录和候选状态机；最大时延和补偿责任未定 | 部分完成，阻塞 |
| 权限版本递增 | 已写入门禁和受影响用户集合；实现与批量失效方案未签收 | 部分完成，待后端确认 |
| 删除与恢复 | 首期不提供，只停用与启用 | 已确认产品边界；后端确认停用约束 |
| 平台跨租户入口 | 独立 `/platform/*`，普通租户 API 禁止请求头切换；已有独立身份载体候选 | 已确认产品边界；平台载体待技术签批 |
| 审计事件命名一致性 | `organization.status_changed` 和 `organization.access_denied` 已在合同、OpenAPI 和事件目录统一 | 已在仓库解决；后端事件实现待签收 |
| 真实后端错误结构和事务可行性 | 尚未确认 | 阻塞 |

## 6. 跨文档一致性检查

- [x] README、ADR 和 API 均已改为多租户，不再保留“默认单租户”或“伪 `tenant_id`”结论。
- [x] 用户单机构关系已同步到 ADR、权限矩阵和交互文档。
- [x] 租户级实体、唯一约束、索引、缓存和审计均包含 `tenant_id` 边界。
- [x] 机构状态统一为 `active/inactive`，启停统一使用 `iam:organization:update-status`。
- [x] `scope_id` 已改为 opaque `organization_id`；首期只保留四种标准数据范围，`custom` 明确后置。
- [x] `self` 的资源关系和 `all` 的当前租户语义已明确。
- [x] 个人资料权限已与 `iam:user:*` 管理端权限拆分。
- [x] 重复的 `iam:role:assign` 已删除，角色分配统一为 `iam:user:assign-role`。
- [x] `assertCanManageUser`、`assertCanGrantRole`、`assertCanMoveOrganization` 已定义。
- [x] 最后平台管理员和租户管理员并发不变量已定义。
- [x] `401/403/404`、列表空结果、`412`、`428` 和稳定业务错误码映射已写入规划。
- [x] 机构 API 写操作均映射到权限码、审计事件和事务要求。
- [x] 页面契约矩阵和稳定错误码映射已补充；真实 API 未冻结前仍标记 TBD。
- [x] 机构树表能力边界已按 Nuxt UI `UTable` 展开行组合说明。
- [x] 用户 Drawer、权限矩阵、公告状态和审计独立详情页语义已同步。
- [x] 所有新增契约均标注为提案，没有把未实现端点描述为当前事实。
- [x] 当前源码事实仍仅包括 `is_admin`、`authenticated`、`admin` 和现有 Auth API。
- [x] 未创建第二套设计系统、主题引擎或平行 `--ds-*` 变量。
- [x] 本轮未在规划任务中修改 `src/**`、认证、权限、路由或生产包。
- [x] `MANUAL-01` 至 `MANUAL-12` 的人工产品决策均已关闭并记录证据。
- [x] 审计事件命名已在合同、OpenAPI 和事件目录统一，并补充拒绝事件独立安全通道。
- [x] 已新增 `organization-slice-l3-task.md` 任务契约草案，列明允许路径、复用、测试和风险。
- [x] HTML 原型已完成，并通过键盘、焦点恢复、状态、320px 和 axe 自动验收。
- [ ] 机构 API 已取得后端真实 OpenAPI 或等价 Schema。
- [ ] 后端真实 OpenAPI、审计存储和权限版本实现方案完成签收。
- [ ] 完成 HTML 原型实现评审并记录结论；按 `MANUAL-12` 不新增多角色签收、版本号或证据包要求。
- [ ] 实现后通过代码级键盘、窄屏和可访问性验收。
- [ ] 产品、后端、安全、运维、前端完成最终联签。

## 7. 签收矩阵

| 角色 | 必须签收的文档 | 签收重点 |
|---|---|---|
| 产品负责人 | 能力地图、交互与原型、公告范围 | 范围、优先级、术语、用户流程和人工决策 |
| 后端负责人 | ADR-001、权限矩阵、机构 API、OpenAPI | 数据模型、授权、版本、幂等、错误和审计 |
| 安全负责人 | ADR-001、权限矩阵、机构 API | IdP、身份绑定、防提权、会话、越权和脱敏 |
| 前端负责人 | 交互与原型、机构 API、权限矩阵 | 页面模式、Schema、状态、权限展示和可访问性 |
| 运维/IT | ADR-001、审计与 IdP 决策、OpenAPI 部署 | IdP 接入、部署、日志、备份和会话撤销 |
| 业务管理员 | 能力地图、交互与原型 | 高频任务、机构层级、角色分工和批量规模 |
| 合规/审计 | 审计仅保存、失败关闭和敏感数据策略 | `audit_event_v1`、主存储、完整性保护和脱敏 |

## 8. 机构垂直切片任务契约

完整草案见 `organization-slice-l3-task.md`，当前状态 `CONDITIONAL GO / CONTRACT ADAPTER IMPLEMENTED / PRODUCTION SLICE BLOCKED`。R5 只实现 `src/api/organizations` 契约适配层；本清单只保留放行摘要，不复制第二套任务契约。

- 目标：机构树查看、创建、编辑、移动、停用和启用；覆盖加载、空、筛选无结果、`403/404`、业务冲突、版本冲突、网络和服务错误。
- 非目标：用户、角色、字典、公告、审计查询、`/platform/*`、SSO 协议、删除/恢复、自定义数据范围、机构合并和公共树表适配器。
- API 边界：以 `organization-api-contract-v0.2.md` 和真实后端 OpenAPI 为准；`organization.openapi.yaml` 仅为联合评审提案。
- 允许修改路径：已列于任务契约第 9 节，限 `src/api/organizations`、`src/modules/organizations`、必要路由/导航/权限/i18n/测试文件和指定架构文档。
- 复用依据：`npm run reuse:search -- organization-tree` 无匹配；优先复用 `DataTablePattern`、`ComplexFormPattern`、`UDataTable` 和薄 `U*` 适配器，树表首期采用页面私有 `UTable` 展开行组合。
- 测试命令：任务契约第 10 节已列出 `typecheck`、`lint`、unit、integration、E2E、accessibility 和 build；执行前按实际新增文件复核。
- 批准条件：G1 至 G4 关闭、任务契约第 4 节开始条件全部勾选、完成实现评审记录、交付负责人另行签发实现授权。

## 9. 不进入开发的硬门槛

出现以下任一情况，应停止页面/API 实现并回到规划：

- 机构 API 没有后端真实 OpenAPI 或等价 Schema，却准备把 R5 契约适配层接入生产页面或路由。
- 机构 API 没有后端确认，却准备在生产页面调用接口。
- 角色权限仍只靠 `is_admin`，却准备实现可配置角色和数据范围。
- 数据范围、防提权、最后管理员和会话刷新没有后端设计。
- 审计事件在第一个机构写操作前没有 Schema、事务和可靠写入方案。
- 交互仍是参考项目截图拼凑，没有本仓库设计系统评审。
- 机构树、权限矩阵或状态下拉在窄屏和键盘路径不可用。
- 准备直接修改 `src/**` 但没有单独的实现任务授权和允许修改路径。
