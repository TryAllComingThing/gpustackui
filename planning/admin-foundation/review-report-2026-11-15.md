# 管理平台基础规划 R4 专家团评审报告

- 变更 ID：`admin-foundation`
- 评审日期：2026-11-15
- 评审范围：`planning/admin-foundation/**`、相关架构文档和当前仓库事实
- 评审性质：第 1 至 10 节保留 R4/R4.1 快照；第 11 节记录 R5 契约适配层执行结果
- 总体结论：`NO-GO / PRODUCTION NOT AUTHORIZED`；R5 契约适配层为 `CONDITIONAL GO / IMPLEMENTED`
- 机构垂直切片：`CONDITIONAL GO`，仅在本文第 6 节门禁全部关闭后另行授权
- 机构 API：`NOT FREEZABLE / BACKEND OPENAPI REQUIRED`
- 开发授权：`CONTRACT ADAPTER ONLY / PRODUCTION DENIED`

> 结论口径：可以继续做契约定稿、后端 Schema、HTML 原型、测试计划和实现评审；不得据此报告开始生产页面、真实 API 请求函数、RBAC 扩展或路由实现。

> 状态说明：第 1 至 9 节保留 2026-11-15 初次 R4 评审快照。仓库内后续完成的设计输入、原型和机械检查见第 10 节；第 11 节记录 R5 契约适配层。上述内容不替代任何外部技术签批。两者冲突时，以第 11 节和 `decision-log.md` 为准：仅契约适配层条件放行，生产实现仍为 `DENIED`。

## 1. 专家团结论

| 专家视角 | 结论 | 主要判断 |
|---|---|---|
| 产品与业务架构 | `REVISE` | `MANUAL-01` 至 `MANUAL-12` 已由产品经理确认；但管理概览访问对象、个人资料 API 边界和部分模块范围仍未闭合，不能表述为全部产品细节已签收 |
| 身份安全与架构 | `BLOCK` | IdP 产品方向已确认，但企业 IdP 可用性、issuer/回调、邀请有效期、默认机构/角色、退出联动和破窗网络/MFA 的部署实现仍未签批 |
| 授权与审计 | `BLOCK` | `platform_admin` 身份载体、可委派权限、`org_admin` 条件授权、最后管理员事务和审计 Outbox 仍未冻结 |
| 后端 API 与数据模型 | `BLOCK` | 机构 API 只有联合评审提案；真实 OpenAPI、错误结构、结构锁、幂等存储/TTL、事务和审计补偿均未由后端签收 |
| 前端、UX 与可访问性 | `BLOCK` | 当前前端只有 `authenticated/admin/is_admin`；关键 HTML 原型不存在，复杂页面无法进入实现评审和代码级验收 |
| 交付与测试门禁 | `BLOCK` | `review-checklist.md` 未通过，机构切片 L3 任务仍是骨架，允许修改路径和测试命令待定 |

综合判断：方向与产品范围可保留，不推倒重来；但只要身份、授权、真实 API 或原型任一硬门禁未关闭，就不能授权全量开发。机构垂直切片可以作为第一个条件放行对象，不能作为默认整体放行依据。

## 2. 文档覆盖与当前状态

| 文档 | 评审状态 | 当前判断 |
|---|---|---|
| `README.md` | 当前入口 | 已正确声明 `DENIED`、技术门禁待完成；不再代表全量可开发 |
| `decision-log.md` | 当前决策源 | 产品决策已确认；工程默认值仍为 `PRODUCT_APPROVED`，技术签批未完成 |
| `adr-001-identity-tenant-organization.md` | 技术候选 | 产品已批准产品范围；后端、安全、运维、前端批准记录仍待填写 |
| `capability-map.md` | 能力规划 | 六个角色端到端闭环均为 `PARTIAL`，SSO、RBAC、字典、公告和审计 API 未定义 |
| `role-permission-matrix.md` | 权限候选 | 主模型成立；`COND` 授权策略和 `grantable_permissions` 仍需后端/安全签收 |
| `organization-api-contract-v0.1.md` | 历史文档 | `SUPERSEDED`，含删除等旧语义，不得作为当前实现依据 |
| `organization-api-contract-v0.2.md` | 契约候选 | `NOT FREEZABLE`；冻结条件尚未满足 |
| `organization.openapi.yaml` | OpenAPI 3.1 提案 | 结构可机检；明确标注不是后端契约，不能接入 `src/api/` |
| `interaction-and-reference.md` | 交互规划 | 页面模式、状态和错误映射较完整；HTML 原型尚未产出 |
| `page-contract-matrix.md` | 页面契约候选 | 多个 API 为 `TBD`，管理概览访问对象未决，不能形成生产路由 |
| `review-checklist.md` | 评审门禁 | 明确未通过；真实 OpenAPI、技术签批、HTML 原型和最终联签均未完成 |
| `review-report-2026-11-14.md` | 历史证据 | 首轮结论保留，不替代当前签批 |
| `review-report-2026-11-14-r2.md` | 历史证据 | R2 结论保留，不替代当前签批 |
| `review-report-2026-11-14-r3.md` | 历史证据 | R3 结论保留；其中关于 `MANUAL-*` 的 `OPEN` 状态已被当前产品决策覆盖，但技术类阻塞不能视为自动解决 |

历史报告不要求改写。当前状态以 `decision-log.md` 和本报告的证据核对结果为准。

## 3. 阻断项

> R4.1 更新：以下 R4-03 至 R4-10 为初次评审快照；仓库内后续动作和当前状态见第 10.1 节。尤其 R4-06 的事件命名、R4-07 的原型和 R4-10 的 L3 任务已不再是初次描述的状态。

### R4-01 后端真实契约仍缺失

**级别：Blocker**

- `organization.openapi.yaml` 是前端/后端联合评审提案，文件自身标注 `x-contract-provenance: frontend-backend-review-proposal`、`x-freeze-status: NOT_FREEZABLE`。
- 当前提案包含 5 条路径、7 个操作、15 个 Schema 和 27 个命名示例，但仓库没有后端已实现或已签收的机构 API。
- 机械校验通过只能证明提案内部结构自洽，不能证明字段、事务、幂等和审计语义可被后端实现。

**关闭条件：** 后端提交真实 OpenAPI 3.1 或等价 Schema，完成 OpenAPI lint、示例 Schema 校验、与 v0.2 提案的差异清单和差异关闭记录。

### R4-02 跨角色技术签批未完成

**级别：Blocker**

- `adr-001-identity-tenant-organization.md` 中后端、安全、运维/IT、前端负责人仍为“待填写 / 待批准”。
- 产品批准只覆盖产品范围和工程默认值，不覆盖租户隔离、数据库不变量、Session 撤销、审计可靠写入和部署安全。

**关闭条件：** 形成具名、带日期、范围和证据链接的技术联签；不能以文档中的 `PRODUCT_APPROVED` 代替。

### R4-03 平台管理员身份载体仍不可实现

**级别：Blocker**

- `platform_admin` 定义为 `platform_all`，但普通 `UserRoleBinding` 必须带 `tenant_id`，且明确禁止用普通租户绑定表达平台管理员。
- 独立 `/platform/*` 入口和平台审计字段尚未形成后端 Schema。

**关闭条件：** 冻结平台身份存储、目标租户选择方式、平台权限目录、平台操作审计、普通 API 禁跨租户机制和 `/platform/*` 契约。

### R4-04 授权策略仍有未决条件

**级别：Blocker**

- `role-permission-matrix.md` 仍把 `org_admin` 的密码重置、角色分配、公告发布/撤回交给后端安全策略和模块契约确认。
- `grantable_permissions` 必须由权限目录标注可委派性，但当前权限目录和 API 尚未定义。
- 最后平台管理员、每租户最后管理员的事务与初始化流程尚未由后端证明可实现。

**关闭条件：** 关闭全部 `COND` 规则，提交可委派权限目录、目标范围子集算法、最后管理员事务测试场景和初始化/迁移策略。

### R4-05 IdP 与身份生命周期未形成部署契约

**级别：Blocker**

- 产品已确认首期接入 IdP、不开放 JIT、破窗仅要求受控内网 + MFA。
- 企业已有 IdP 是否可用、Keycloak 部署责任、issuer/audience、回调地址、Token 交换、声明映射、邀请有效期、默认机构/角色、IdP 停用同步和最大会话分叉时延仍未签批。

**关闭条件：** 安全、IT、运维和后端共同冻结部署拓扑、OIDC 参数、邀请生命周期、会话撤销与破窗控制实现。

### R4-06 审计与 Outbox 仍不可签收

**级别：Blocker**

- `audit_event_v1` 的完整 Schema、最大投递时延、存储容量和人工补偿责任仍未确认。
- 审计 Outbox 候选状态机已写入文档，但没有后端实现、告警责任或测试样例。
- 当前 OpenAPI 与 v0.2 契约的审计事件名不完全一致：契约写 `organization.status_changed`，OpenAPI 写 `organization.activated` / `organization.deactivated`。

**关闭条件：** 统一事件目录与命名；完成后端事务、Outbox、重试、告警、人工补偿和失败关闭的签收与测试。

### R4-07 关键 HTML 原型不存在

**级别：Blocker**

- 仓库未发现机构树、权限矩阵、公告或审计详情的 HTML 原型；只有 `index.html` 和 `showcase/index.html`。
- `MANUAL-12` 免除了额外多角色原型签收和证据包，但没有免除 HTML 原型及实现评审本身。
- 机构树键盘路径、窄屏移动、冲突状态，以及权限矩阵 `mixed`/窄屏操作仍无法通过原型验证。

**关闭条件：** 完成机构、权限矩阵、公告、审计复杂场景 HTML 原型，并完成键盘、窄屏、状态矩阵和实现评审。机构垂直切片最低需要机构树与移动/启停原型。

### R4-08 前端权限实现与目标模型差距过大

**级别：Blocker**

- 当前 `AuthPermission` 仅为 `authenticated | admin`；`AuthUser` 仅有 `is_admin`。
- 当前 guard、导航和路由没有租户、RBAC 权限目录或四种数据范围。
- 扩展权限模型属于 L3 变更，必须同步 `docs/architecture/AUTH-AND-PERMISSIONS.md`、路由、导航、Schema、测试与失败关闭行为。

**关闭条件：** 后端确认权限编码和能力返回方式后，另立 L3 任务实现权限扩展；不得在页面内先造假权限或角色名单。

### R4-09 除机构外的模块 API 尚未定义

**级别：High**

- 用户、角色、字典、公告、审计 API 均为 `TBD`。
- 管理概览聚合 API 和个人资料读写能力尚未与真实后端对齐。
- 数据字典、公告和审计页面不得以 fixture 代替真实接口进入生产实现。

**影响：** 可以继续原型和契约设计，但不能按“六个模块一起开发”排期。

### R4-10 机构切片 L3 任务契约仍是骨架

**级别：Blocker**

- `review-checklist.md` 的允许修改路径仍为“待评审后列出”，测试命令仍为“待按实际 repo 脚本列出”。
- 复用依据仍包含重复的 `ComplexFormPattern`，尚未形成准确的文件级修改边界。

**关闭条件：** 另立独立 L3 任务，列出目标、非目标、真实 API 契约、允许修改路径、复用检索结果、测试命令、回滚与风险。

## 4. 文档一致性问题

| ID | 级别 | 问题 | 建议 |
|---|---|---|---|
| DOC-01 | High | 审计事件名在契约与 OpenAPI 之间不一致 | 在冻结前统一为同一事件目录，并补充 `organization.access_denied` 的审计载体说明 |
| DOC-02 | Medium | 角色定义是租户级，但页面矩阵给角色页列出 `org/org_subtree/all` 数据范围，容易被误读为机构级角色定义 | 区分“角色定义范围”和“可见范围”，或把角色写操作明确限定为当前租户 `all` |
| DOC-03 | Medium | v0.2 称幂等记录 24 小时为“产品已批准工程默认值”，但 `decision-log.md` 没有对应 `ENG-*` 条目 | 增加明确决策 ID，或删除“已批准”表述并保留为后端待确认 |
| DOC-04 | Low | `page-contract-matrix.md` 标题仍为 v0.1，而状态已是 R4 | 下一版同步标题和版本 |
| DOC-05 | Low | README 使用“全部产品结论已确认”的宽口径，但 `ADMIN-OVERVIEW`、个人资料 API 和公告历史保留仍有未决项 | 改为“全部人工决策已确认；产品细节仍有列明缺口” |

## 5. GO / NO-GO 矩阵

| 工作项 | 结论 | 原因 |
|---|---|---|
| 全量软件开发 | `NO-GO` | 真实 API、技术签批、RBAC、原型和 L3 任务均未过关 |
| 契约对齐与 OpenAPI 差异评审 | `GO` | 属于当前规划职责，可继续 |
| 后端 Schema、事务、幂等和审计设计 | `GO` | 必须先于前端请求实现 |
| HTML 原型与可访问性评审 | `GO` | 产品已确认原型采用 HTML，且是硬门禁 |
| 测试计划与契约测试样例 | `GO` | 可先定义，不得宣称已执行 |
| 机构垂直切片生产实现 | `CONDITIONAL GO` | 仅在 R4-01、R4-02、R4-04、R4-06、R4-07、R4-10 关闭后另行授权 |
| 用户与角色生产实现 | `NO-GO` | 用户/角色 API、RBAC 和前端权限扩展均未定义 |
| 字典、公告、审计生产实现 | `NO-GO` | API 为 `TBD`，审计存储和公告版本化未冻结 |
| SSO、会话撤销、平台管理生产实现 | `NO-GO` | IdP 部署契约和平台身份载体未签批 |
| 把提案 YAML 当作后端契约 | `PROHIBITED` | 文件自身已标注 `NOT_FREEZABLE` |
| 用 fixture 冒充真实接口 | `PROHIBITED` | 违反仓库 API 契约和评审门禁 |

## 6. 有条件放行顺序

建议按以下顺序关闭门禁；G1、G3、G4 可部分并行，但 G5 必须最后执行。

| 门禁 | 完成条件 | 责任方 | 解除内容 |
|---|---|---|---|
| G1 真实契约 | 后端提供真实 OpenAPI 3.1；lint、示例校验和差异关闭完成 | 后端、前端 | 解除机构 API 的 `NOT FREEZABLE` |
| G2 技术联签 | ADR、权限矩阵、机构 API 和审计/会话方案完成具名技术签批 | 后端、安全、运维、前端 | 解除架构与安全阻塞 |
| G3 策略闭环 | 关闭 `platform_admin` 载体、`COND`、可委派权限、最后管理员和 IdP 部署契约 | 安全、后端、IT/运维 | 解除授权与身份阻塞 |
| G4 原型闭环 | 完成机构关键流程 HTML 原型和键盘/窄屏/状态评审 | 产品、前端、设计 | 解除页面原型阻塞 |
| G5 任务契约 | 形成独立机构切片 L3 任务，列明路径、复用依据、测试和风险 | 前端负责人、评审人 | 允许另行签发实现任务 |

### 机构切片最低放行条件

1. 后端真实 OpenAPI 与 v0.2 提案差异为零，或差异已逐条签收并同步文档。
2. 后端确认单根、四级、循环检测、结构锁、事务、权限版本、Idempotency-Key 和审计 Outbox 可实现。
3. 安全确认 `tenant_id` 注入、数据范围、防提权、`401/403/404` 和最后管理员路径。
4. 机构树、移动和启停 HTML 原型完成，并通过键盘与 320px 窄屏评审。
5. 前端确认真实 API、错误码、Zod Schema、路由、权限展示和可访问名称。
6. L3 任务契约获批，允许修改路径仅限机构 API/模块、必要路由/i18n/测试文件。

## 7. 建议的下一步

1. 产品负责人先关闭 `ADMIN-OVERVIEW` 访问对象和个人资料 API 边界，避免管理首页与普通用户首页在实现期返工。
2. 后端用真实 OpenAPI 替换“提案待确认”状态，并把事务、幂等、锁、审计和错误结构写成可测试契约。
3. 安全、后端、运维和前端召开一次联签会，逐项关闭 ADR/权限矩阵的 `待批准` 与 `COND`。
4. 前端只制作 HTML 原型，不进入 `src/api/organizations`、机构页面、真实路由或 RBAC 扩展。
5. 修正审计事件命名、角色页数据范围和幂等 TTL 决策追溯等文档一致性问题。
6. 最后再创建机构垂直切片 L3 任务；任务获批前保持 `src/**` 不变。

## 8. 机械检查记录

本轮执行了以下可重复检查：

- Ruby YAML 解析：`openapi: 3.1.0`，5 条路径、7 个操作、15 个 Schema、27 个命名示例。
- js-yaml 严格解析和本地 `$ref` 检查：171 个本地引用，0 个断链。
- operationId 唯一性检查：7 个 operationId 均唯一。
- 路径参数检查：所有 `{organization_id}` 均在操作或路径层声明。
- 空白检查：未发现 Markdown/YAML 行尾空白。

未执行项：仓库未安装 Redocly、Spectral 或等价 OpenAPI linter，因此不能声称已完成完整 OpenAPI lint。该检查仍是 G1 的必做项。

## 9. 最终建议

```text
方向：保留，继续契约与原型工作
全量软件开发：NO-GO
机构垂直切片：当前 NO-GO；完成 G1-G5 后可有条件放行
机构 API：NOT FREEZABLE
前端生产实现：DENIED
可立即执行：契约对齐、后端 Schema、HTML 原型、测试计划、技术联签
不可执行：真实 API 请求函数、生产管理页面、RBAC/路由扩展、fixture 冒充接口
```

## 10. R4.1 执行更新

- 执行日期：2026-11-15
- 执行范围：仅 `planning/admin-foundation/**`；未修改 `src/**`、认证、权限、路由、API 请求函数、主题 Token 或生产包。
- 总体结论不变：`NO-GO / DEVELOPMENT NOT AUTHORIZED`。
- 机构垂直切片不变：`CONDITIONAL GO`，必须在 G1 至 G5 全部关闭并另行签发 L3 任务后才能实现。

### 10.1 阻塞项改判

| 阻塞项 | 初次状态 | 当前状态 | 本轮仓库内动作 | 仍不能自动关闭的条件 |
|---|---|---|---|---|
| R4-01 后端真实 OpenAPI | `BLOCKED` | `BLOCKED` | 修订提案元数据、审计事件引用和本地引用机检；生成 `organization.backend-openapi.yaml` 后端交接草案；未伪造后端签批 | 后端真实 OpenAPI 3.1、OpenAPI lint、示例 Schema 校验、与 v0.2 的差异关闭记录 |
| R4-02 跨角色技术签批 | `BLOCKED` | `BLOCKED` | 补齐平台身份、RBAC、IdP、审计的可签批输入 | 后端、安全、运维/IT、前端具名签批及证据链接 |
| R4-03 平台管理员身份载体 | `BLOCKED` | `PARTIAL` | 新增 `platform-admin-identity-proposal.md`，定义独立平台主体、绑定、权限和审计 | 平台身份来源、目标租户表达、会话上下文、审计存储责任和最后平台管理员锁仍待签批 |
| R4-04 授权策略 | `BLOCKED` | `PARTIAL` | 在权限矩阵补充 `COND` 安全默认候选，明确默认拒绝和可委派边界 | 可委派权限目录、目标范围子集算法、最后管理员事务证明和安全/后端签批 |
| R4-05 IdP 与身份生命周期 | `BLOCKED` | `PARTIAL` | 新增 `idp-deployment-contract.md`，形成企业 IdP/OIDC 部署契约模板 | 企业 IdP 是否可用、issuer/audience、回调、声明映射、邀请有效期、默认机构/角色、退出联动和破窗部署仍为 `TBD` |
| R4-06 审计与 Outbox | `BLOCKED` | `PARTIAL` | 统一事件名为 `organization.status_changed`；新增 `audit_event_v1` Schema、事件目录和 Outbox 候选状态机 | 存储、保留、最大投递时延、告警责任、人工补偿责任、权限拒绝独立通道和完整 2020-12 验证仍待签批 |
| R4-07 HTML 原型 | `BLOCKED` | `PARTIAL` | 新增机构、权限矩阵、公告、审计 HTML 原型；自动化验证键盘、焦点恢复、状态、320px 和 axe 通过；已记录截图检查证据 | 实现评审负责人确认记录；按 `MANUAL-12` 不新增多角色签收、版本号或证据包；代码级可访问性验收在实现后执行 |
| R4-08 前端 RBAC | `BLOCKED` | `BLOCKED` | 新增 `frontend-rbac-contract-proposal.md`，提出会话能力返回和失败关闭规则 | 后端权限返回 Schema、权限目录、权限版本刷新语义和 L3 实现批准；源码仍只有 `authenticated/admin/is_admin` |
| R4-09 其他模块 API | `BLOCKED` | `BLOCKED` | 在任务边界中继续排除用户、角色、字典、公告和审计生产实现 | 各模块真实 API、页面契约、测试计划和独立任务授权 |
| R4-10 机构切片 L3 任务 | `BLOCKED` | `PARTIAL` | 新增 `organization-slice-l3-task.md`，补齐目标、非目标、路径、复用、测试、风险和门禁 | 真实契约、技术签批、原型人工评审、测试命令复核和 G5 最终批准 |

### 10.2 文档一致性问题的关闭情况

| 问题 | 状态 | 证据 |
|---|---|---|
| DOC-01 审计事件命名不一致 | `RESOLVED IN REPO` | 合同、OpenAPI 和事件目录统一为 `organization.status_changed`；拒绝事件使用 `organization.access_denied` 独立安全通道 |
| DOC-02 角色定义范围与可见范围混淆 | `RESOLVED IN REPO` | `page-contract-matrix.md` 明确读范围可为 `org/org_subtree/all`，角色定义写操作仅当前租户 `all` |
| DOC-03 幂等 TTL 被误写为已批准 | `RESOLVED IN REPO` | v0.2 已改为 24 小时候选建议值，最终 TTL、清理任务和存储由后端确认 |
| DOC-04 页面矩阵版本标题不一致 | `RESOLVED IN REPO` | 标题和状态已同步为 v0.2 / R4.1 |
| DOC-05 README 产品结论口径过宽 | `RESOLVED IN REPO` | 改为“全部人工决策已确认；产品细节仍有列明缺口” |

以上“已在仓库解决”只表示文档一致性已修正，不表示外部技术门禁已关闭。

### 10.3 新增可评审输入

- `platform-admin-identity-proposal.md`：平台管理员独立身份平面和隔离验收候选。
- `frontend-rbac-contract-proposal.md`：前端权限返回、路由元数据和未知 token 失败关闭候选。
- `idp-deployment-contract.md`：企业 IdP/OIDC 部署契约模板，空白项仍为 `TBD`。
- `audit-event-v1.schema.json`：审计事件信封 2020-12 草案。
- `audit-event-catalog.md`：机构事件目录、Outbox 状态机和验收场景。
- `organization-slice-l3-task.md`：机构垂直切片 L3 任务契约草案。
- `organization.backend-openapi.yaml`：基于规划文档生成的后端交接草案，供后端补全真实拓扑、实现语义和差异关闭；不是后端已签批契约。
- `prototypes/admin-foundation/`：机构、权限矩阵、公告和审计 HTML 原型及自动验收脚本。
- `prototype-implementation-review.md`：G4 自动验收、截图检查和实现评审记录；负责人确认仍待填写。
- `shortest-path-execution.md`：G1-G5 最短推进路径、后端 OpenAPI 交接清单、G2/G3 联签决策包和停止条件。

这些文件均为提案或测试资产，不是后端实现、技术签批或开发授权。

### 10.4 R4.1 机械检查

已执行并通过：

- OpenAPI 3.1 解析：5 条路径、7 个操作、15 个 Schema、27 个命名示例。
- 后端交接草案 `organization.backend-openapi.yaml` 解析：与提案的 paths、schemas、examples、responses、parameters 和 security 完全一致，仅增加交接元数据和实现约束。
- 本地 `$ref` 检查：171 个引用，0 个断链。
- `operationId` 唯一性：7 个均唯一。
- 路径参数检查：无缺失声明。
- 审计 Schema JSON 解析：24 个属性、15 个必填字段、无“必填但未定义”属性；平台分支和失败分支的 `if/then` 约束存在。
- 行尾空白检查：相关 Markdown、YAML、JSON 文件均为 0 行。
- 复用检索：`npm run reuse:search -- organization-tree` 无匹配，支持机构树首期采用页面私有实现。
- HTML 原型自动验收：`node planning/admin-foundation/prototypes/admin-foundation/verify.mjs` 已返回 `ok: true`，覆盖主题/密度/外观、树键盘、Drawer Escape 与焦点恢复、409、权限矩阵变更摘要、公告撤回、审计只读、320px 横向溢出和 axe WCAG 2 A/AA。

未执行或不能声称通过：

- 仓库未安装 Redocly、Spectral 或等价 OpenAPI linter，未完成 G1 所需的完整 OpenAPI lint。
- 仓库只有 Ajv 6，未提供 JSON Schema 2020-12 验证器；本轮只做 JSON 解析和结构约束检查，不能声称完成完整 Schema 验证。
- 未执行后端请求、数据库事务、Outbox、IdP 或真实权限测试；这些能力尚不存在。

### 10.5 有条件放行 G1-G5 当前状态

| 门禁 | 当前状态 | 仓库内已完成 | 仍需解决的关闭条件 | 责任方 |
|---|---|---|---|---|
| G1 真实契约 | `BLOCKED` | 机构 OpenAPI 3.1 提案、引用机检和差异对照输入 | 后端真实 OpenAPI、lint、示例 Schema 校验、差异逐条关闭 | 后端、前端 |
| G2 技术联签 | `BLOCKED` | ADR、权限矩阵、平台身份、IdP、审计和 RBAC 待签批输入 | 具名、带日期、带范围和证据链接的技术签批 | 后端、安全、运维/IT、前端 |
| G3 策略闭环 | `PARTIAL` | `platform_admin` 候选载体、`COND` 安全默认、IdP 模板、审计事件目录 | 真实环境事实、可委派权限目录、最后管理员事务证明、存储/投递/补偿责任 | 安全、后端、IT/运维、合规 |
| G4 原型闭环 | `PARTIAL` | HTML 原型完成；键盘、320px、状态和 axe 自动验收通过；评审记录和截图检查已写入 | 实现评审负责人确认记录；按 `MANUAL-12` 不新增多角色签收、版本号或证据包；实现后代码级验收 | 实现评审负责人 |
| G5 任务契约 | `PARTIAL` | `organization-slice-l3-task.md` 草案完整，允许路径、复用、测试和风险已列明 | 真实契约复核、测试命令最终复核、G1-G4 关闭和交付负责人批准 | 前端负责人、评审人、交付负责人 |

### 10.6 R4.1 结论

```text
全量软件开发：NO-GO
机构垂直切片：CONDITIONAL GO
机构 API：NOT FREEZABLE
开发授权：DENIED
可继续：契约对齐、后端 Schema/事务/幂等/审计设计、HTML 原型人工评审、测试计划、技术联签
不可执行：src/api/organizations 真实请求函数、机构/用户/角色生产页面、RBAC/路由扩展、fixture 冒充接口
```

## 11. R5 专家团条件推进

- 决策记录：`expert-panel-decision-2026-11-15.md`。
- 用户指令：由专家团直接推荐并立即开始，不再等待逐项人工确认。
- 评审结论：`CONDITIONAL GO / CONTRACT ADAPTER ONLY`；生产垂直切片仍为 `NO-GO`。

本轮实际完成：

- 新增 `src/api/organizations`：7 个端点函数、组织/树/列表/错误 Schema、查询与请求体映射。
- 写操作强制 `Idempotency-Key` 和 `If-Match`；创建、更新、移动、状态变更均拒绝客户端租户上下文。
- HTTP 错误归一化增加 `PRECONDITION_FAILED`、`PRECONDITION_REQUIRED`，并安全提取稳定 `serverCode` 和 `request_id`。
- 新增机构 Schema、API 传输和错误契约单测。
- 未注册机构路由、未创建页面、未扩展 RBAC；因此不会改变现有认证和授权语义。

R5 后的门禁口径：

| 项目 | 状态 | 说明 |
|---|---|---|
| 机构 API 契约适配层 | `CONDITIONAL PASS` | 按交接草案实现并通过仓库内测试；不是生产冻结契约 |
| 机构生产垂直切片 | `NO-GO` | 仍受 G1/G2/G3/G5 和 D-11 约束 |
| 后端真实 OpenAPI | `REQUIRED` | 仍是下一项关键外部输入 |
| 机构页面/路由/RBAC | `DENIED` | 缺少能力返回契约和真实后端联调 |

最短继续路径：后端真实 OpenAPI → 差异关闭 → D-11 权限返回 → 路由/RBAC → 页面与真实联调。
