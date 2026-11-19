# 管理平台最短推进路径与门禁执行单

- 变更 ID：`admin-foundation/shortest-path`
- 状态：`ACTIVE / R5 CONTRACT ADAPTER IMPLEMENTED / G1 WAITING FOR BACKEND`
- 开发授权：`CONTRACT ADAPTER ONLY / PRODUCTION DENIED`
- 日期：2026-11-15
- 目标：以机构垂直切片作为唯一首个放行对象，按 G1 → G2/G3 → G4 → G5 顺序关闭门禁。
- 非目标：本文不提供后端契约、技术签批、IdP 配置或生产实现授权。

> 当前结论：全量软件开发 `NO-GO`；机构 API 契约适配层已在 R5 条件实现；机构生产垂直切片仍 `NO-GO`；机构 API 生产契约 `NOT FREEZABLE`。本文不把适配层视为生产放行。

## 1. 环境扫描结论

- 当前仓库没有后端源码、真实 OpenAPI 或等价 Schema。
- 父目录 `/Users/kyle/Documents/AI-Innovation-RD` 中发现：
  - `企业知识库平台/02_CONTRACT/OpenAPI_V2.1_Strict.yaml`：知识资产控制面，路径为 `/v1/knowledge-bases` 等，与管理平台的 `/organizations`、`/users`、`/roles`、`/platform/*` 不匹配，不得替代本契约。
  - `GPUStack`：未发现可用于本管理平台的机构 OpenAPI。
- `planning/admin-foundation/organization.openapi.yaml` 仍为前端/后端联合评审提案，文件自身标注 `x-freeze-status: NOT_FREEZABLE`。
- 已基于规划文档生成 `organization.backend-openapi.yaml` 后端交接草案；它包含完整机构路径、Schema、示例和后端实现约束，但仍不是后端已签批契约。
- 因此 G1 必须由后端负责人提供真实契约，前端不能从提案或外部无关项目推导端点。

## 2. 最短执行顺序

| 顺序 | 门禁 | 必须产出 | 责任方 | 验收标准 | 当前状态 |
|---|---|---|---|---|---|
| 1 | G1 真实契约 | 后端 OpenAPI 3.1、lint 结果、示例校验、差异关闭记录 | 后端、前端 | 真实契约可解析、无断链、示例通过 Schema 校验、与 v0.2 差异为零或逐条签收 | `BLOCKED / HANDOFF DRAFT READY` |
| 2 | G2 技术联签 | ADR、权限矩阵、机构 API、审计、IdP、RBAC 的具名签批 | 后端、安全、运维/IT、前端 | 每个决策有负责人、日期、范围、结论和证据链接 | `BLOCKED` |
| 3 | G3 策略闭环 | 平台身份、可委派权限、最后管理员、IdP 部署、审计 Outbox 决策 | 安全、后端、IT/运维、合规 | 所有 `COND`、`TBD` 和平台身份问题有最终结论 | `PARTIAL` |
| 4 | G4 原型闭环 | HTML 实现评审结论；代码级可访问性验收计划 | 实现评审负责人 | 原型与状态矩阵一致；不新增多角色签收、版本号或证据包 | `PARTIAL / EVIDENCE READY` |
| 5 | G5 任务签发 | `organization-slice-l3-task.md` 批准记录 | 交付负责人、评审人 | G1-G4 关闭；测试命令复核；允许路径明确 | `PARTIAL / DENIED` |

G1 和 G2 不得并行“先写生产页面或路由等契约”；R5 只允许契约适配层和测试。G3 可在 G1 进行时并行准备，但最终签批必须引用真实契约。G4 可并行做实现评审，G5 最后签发。

## 3. G1 后端 OpenAPI 交接清单

### 3.1 后端必须提供

- OpenAPI `3.1.0` 文件，带真实 `servers`、安全方案、Cookie/CSRF 约定和部署基础路径。
- 机构 5 条路径、7 个操作：
  - `GET /organizations/tree`
  - `GET /organizations`
  - `GET /organizations/{organization_id}`
  - `POST /organizations`
  - `PATCH /organizations/{organization_id}`
  - `POST /organizations/{organization_id}/move`
  - `POST /organizations/{organization_id}/status`
- `tenant_id` 服务端注入方式；明确禁止普通 API 接受客户端 `tenant_id`、请求头切换或 `platform_all` 旁路。
- `ETag/If-Match`、`428/412/409`、`Idempotency-Key`、幂等记录 TTL、清理任务和同 key 不同 body 的错误码。
- 单根、最大四级、循环检测、结构锁、停用约束、最后管理员事务和权限版本递增。
- 稳定错误外壳、`request_id`、`401/403/404` 语义和未知错误码策略。
- 写操作审计事件、Outbox 失败关闭、平台操作 `actor_scope=platform`、`target_tenant_id` 和 `platform_permission`。
- 请求/响应示例，覆盖成功、`403`、`404`、`409`、`412`、`428` 和幂等重放。

### 3.2 前端必须完成的差异审查

| 差异维度 | 提案来源 | 必须比对 |
|---|---|---|
| 路径与方法 | `organization.openapi.yaml` | 路径、方法、状态码、operationId |
| 字段类型 | `organization-api-contract-v0.2.md` | `id`、`code`、`parent_id`、`status`、`version`、时间字段 |
| 租户边界 | ADR 2.2 | 服务端注入、禁止客户端切换、平台 API 独立 |
| 并发控制 | API 5.2/5.3 | `ETag`、`If-Match`、`428/412`、结构锁 |
| 幂等 | API 5.4 | key 指纹、TTL、重放、同 key 不同 body |
| 权限 | 权限矩阵 | `iam:organization:*`、数据范围、逐动作授权 |
| 审计 | `audit-event-catalog.md` | `organization.created/updated/moved/status_changed/access_denied` |
| 平台入口 | `platform-admin-identity-proposal.md` | `/platform/*`、目标租户表达、平台审计 |
| 错误 | API 第 6 节 | 错误码、`request_id`、未知码失败关闭 |
| 示例 | OpenAPI components | 示例是否符合真实 Schema，不以展示文案代替结构化字段 |

差异登记模板：

| DIFF ID | 提案位置 | 后端真实契约 | 差异结论 | 处理人/日期 | 证据 |
|---|---|---|---|---|---|
| DIFF-001 | 待填写 | 待填写 | `OPEN` | — | — |

### 3.3 G1 验收命令

后端真实契约到位后，至少执行：

```text
redocly lint <backend-openapi>
redocly bundle <backend-openapi> --output /tmp/backend-openapi.bundled.yaml
npx ajv-cli validate -s <response-schema> -d <examples> --spec=draft2020
```

当前仓库未安装 Redocly、Spectral 或 2020-12 验证器，因此上述命令需要在具备工具的环境或 CI 中执行，不能以本地 `js-yaml` 解析代替。仓库内现有检查仅覆盖 OpenAPI 解析、本地 `$ref`、operationId 和路径参数初检，不等同于完整 lint。

### 3.4 G1 停止条件

- 没有后端归属人、版本号和可访问存储位置。
- 仍含 `example.invalid`、占位服务器或未冻结的临时字段。
- 用提案 YAML、fixture 或前端 mock 冒充真实契约。
- 租户切换、平台身份、审计失败关闭或最后管理员语义仍由前端猜测。

## 4. G2/G3 联签决策包

以下为建议决策，不是已批准结论。联签会议应逐项记录负责人、日期、选择和证据。

| ID | 决策问题 | 推荐候选 | 签批方 | 状态 |
|---|---|---|---|---|
| D-01 | 平台管理员首期身份来源 | 企业 IdP group 为主；受控本地破窗仅作应急，且仅受控内网 + MFA | 安全、IT/运维 | `PENDING` |
| D-02 | 平台操作目标租户表达 | 独立 `/platform/tenants/{tenant_id}/...` 路径；不接受普通请求头切换 | 后端、安全 | `PENDING` |
| D-03 | 平台会话与普通租户会话关系 | 同一 Session 内由后端签发 `actor_scope=platform`；如安全要求则允许独立登录 | 安全、后端、前端 | `PENDING` |
| D-04 | `COND` 安全默认 | 采用 `org_admin` 禁止重置凭证、禁止公告发布/撤回、仅分配受限角色；`tenant_admin` 可同租户增补管理员但受最后管理员保护 | 安全、后端 | `PENDING` |
| D-05 | 可委派权限目录 | 权限目录增加 `delegable` 或等价元数据，默认 `false`；目标范围必须是调用者可授予范围的子集 | 后端、安全 | `PENDING` |
| D-06 | 企业 IdP 或 Keycloak | 有企业 IdP 则优先复用；否则 Keycloak；最终由 IT/运维确认 | IT/运维、安全 | `PENDING` |
| D-07 | 邀请有效期、默认机构和默认角色 | 待企业 IdP 确认后决定；不得按邮箱域名自动绑定或 JIT 创建 | 安全、IT、产品 | `PENDING` |
| D-08 | 会话撤销与退出联动 | 停用、解绑、改密、破窗强制退出递增 `session_version`；IdP 退出作为补充；最大传播时延明确 | 安全、后端、IT | `PENDING` |
| D-09 | 审计存储、投递和补偿 | 业务事务写 Outbox；P95 ≤ 60s、指数退避、终态告警和人工补偿为候选 | 后端、运维、合规 | `PENDING` |
| D-10 | 最后管理员并发保护 | 全局平台锁与租户级锁分离；使用行锁或可串行化事务；并发移除最后一个管理员必须失败关闭 | 后端、安全 | `PENDING` |
| D-11 | 前端能力返回方式 | 优先扩展 `/api/users/me` 的版本化 `authorization`；若权限包过大再采用独立能力端点 | 后端、前端 | `PENDING` |
| D-12 | 授权拒绝审计 | 使用独立可靠安全通道，不复用可能回滚的业务 Outbox；不泄露范围外对象存在性 | 安全、后端、合规 | `PENDING` |

G2 会议的最低输出不是“原则同意”，而是每个决策的最终选择、反例测试和证据链接。

## 5. G4 HTML 原型实现评审记录模板

按 `MANUAL-12`，不新增多角色签收、版本号或独立证据包；只保留一次实现评审记录。

```text
评审日期：
评审负责人：
评审范围：机构树、创建/编辑、移动、启停、权限矩阵、公告、审计
自动验收：verify.mjs ok=true；键盘/焦点恢复/409/320px/axe 结果
人工检查：状态矩阵、术语、可理解性、与 DESIGN.md 一致性
发现问题：
处理结论：通过 / 有条件通过 / 退回修订
后续代码级验收责任：
```

原型文件：`prototypes/admin-foundation/index.html`；自动验收：`prototypes/admin-foundation/verify.mjs`。

## 6. G5 机构切片签发条件

- G1 真实 OpenAPI 与 v0.2 提案差异关闭。
- G2 必需角色完成具名签批。
- G3 所有 `COND`、平台身份和 IdP 关键项有最终结论。
- G4 实现评审记录存在，且没有未处理的高风险问题。
- `organization-slice-l3-task.md` 第 4 节开始条件全部满足。
- 测试命令按实际新增文件复核；允许修改路径不扩大到用户、角色、字典、公告或审计模块。

满足后只授权机构垂直切片，不自动授权用户、角色、字典、公告、审计或 `/platform/*` 实现。

## 7. 下一步交接动作

1. 后端负责人按第 3.1 节提供真实 OpenAPI 和可访问位置。
2. 前端按第 3.2 节生成差异表，逐项关闭或升级为联签决策。
3. 安全、后端、运维/IT、前端用第 4 节召开一次 G2/G3 联签会。
4. 实现评审负责人按第 5 节记录 G4 结论。
5. 交付负责人按第 6 节决定是否签发 G5；未满足时任一项都保持 `DENIED`。

## 8. 给后端的直接请求模板

```text
请提供机构管理 API 的真实 OpenAPI 3.1 文件（不是前端提案），并附：
1. 文件版本号、归属人、可访问位置；
2. 真实 servers、安全方案、Cookie/CSRF 和基础路径；
3. tenant_id 服务端注入与禁止客户端切换的说明；
4. 5 条机构路径、7 个操作、错误码和示例；
5. ETag/If-Match、Idempotency-Key、TTL、结构锁和事务语义；
6. 审计事件、Outbox 失败关闭、平台操作审计字段；
7. 单根、四级、循环、停用约束和最后管理员事务说明；
8. lint、示例 Schema 校验和与 planning/admin-foundation/organization.openapi.yaml 的差异清单。
```

## 9. 当前进度快照

| 门禁 | 仓库内已完成 | 外部待办 |
|---|---|---|
| G1 | OpenAPI 3.1 提案、后端交接草案、交接验收清单、差异登记模板 | 后端真实 OpenAPI、lint、示例校验、差异关闭 |
| G2 | ADR/权限/身份/审计/RBAC 待签批输入、D-01 至 D-12 决策包 | 后端、安全、运维/IT、前端具名签批 |
| G3 | 平台身份候选、IdP 模板、`COND` 安全默认、审计 Schema 和事件目录 | 最终策略选择、真实 IdP 参数、存储/投递/补偿责任 |
| G4 | HTML 原型、自动验收、截图检查、实现评审记录 | 实现评审负责人确认；实现后代码级可访问性 |
| G5 | L3 任务草案、允许路径、测试命令、签批记录表 | G1-G4 关闭后由交付负责人签发 |

下一步唯一立即外部输入是第 3.1 节的后端 OpenAPI；在它到位前，G2/G3 可以开会，但不能完成最终签批。

## 10. R5 条件推进执行记录

- 决策：`expert-panel-decision-2026-11-15.md`，结论为 `CONDITIONAL GO / CONTRACT ADAPTER ONLY`。
- 已完成：`src/api/organizations` Schema、查询映射、7 个端点函数、Header 校验和单测。
- 已完成：HTTP `412/428` 错误分类、稳定业务错误码和 `request_id` 回填。
- 未执行：生产路由、页面、RBAC、真实环境请求、后端事务/幂等/审计验收。
- G1 仍为 `BLOCKED`；G5 仍不构成生产切片批准。R5 只缩短“后端交接草案 → 可执行前端契约”的反馈回路。

最短后续顺序：

1. 后端返回真实 OpenAPI 3.1，并与交接草案逐项关闭差异。
2. 关闭 D-11 权限返回方式，再扩展 `AuthPermission` 和路由元数据。
3. 将契约适配层提升为生产契约，接入机构模块和页面。
4. 最后执行机构 E2E、可访问性、真实后端联调和发布评审。
