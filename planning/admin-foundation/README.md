# 管理平台基础能力规划

- 变更 ID：`admin-foundation`
- 文档状态：`PROPOSED / FRONTEND LOCAL ADMIN SLICES IMPLEMENTED`
- 评审状态：`ALL PRODUCT DECISIONS CONFIRMED / FRONTEND-ONLY SLICES IMPLEMENTED / REAL API INTEGRATION PENDING`
- 开发授权：`FRONTEND LOCAL FIXTURE SLICES / REAL API CONNECTION PENDING`
- 日期：2026-11-16
- 目标用户：平台管理员、租户管理员、机构管理员、审计员、只读管理员
- 目标结果：形成可评审的能力边界、权限模型、身份/租户/组织决策和机构 API 契约，并在前端仓库实现使用本地 fixtures 的机构、用户、角色、字典、公告和审计基础切片。
- 非目标：不开发后端服务、不实现 SSO、不修改主题和设计 Token；不把交接 OpenAPI 或本地 fixtures 当作真实后端能力验收。

## 1. 本目录定位

本目录是规划材料，不是实现事实来源。所有接口路径、权限码和角色均为提案，必须由后端契约、OpenAPI、安全评审和人工决策确认后，才能进入 `src/api/` 的真实接入路径。前端可使用明确标注的本地 fixtures 验证页面结构、交互和可访问性；fixtures 不得包装成伪 API，也不得用于声称后端能力已完成。

权威顺序保持不变：

1. 根 `AGENTS.md`
2. 根 `DESIGN.md`
3. `docs/architecture/ARCHITECTURE.md`
4. `docs/architecture/API-CONTRACT.md`
5. `docs/architecture/AUTH-AND-PERMISSIONS.md`
6. `decision-log.md`
7. 本目录其它规划材料
8. 真实源码和后端 OpenAPI

冲突处理：先停止实现，修正 `decision-log.md` 或 ADR，不允许页面或 API 自行选择一套解释。

## 2. 核心结论

1. **先定边界，再做页面。** 机构、用户、角色、数据范围、审计是横切模型，不应由页面反推。
2. **平台采用多租户。** `tenant_id` 是查询、权限、索引、缓存和审计硬边界，普通 API 不接受客户端任意切换租户。
3. **用户当前仅属于一个机构。** 角色数据范围可覆盖机构子树，但不得反向推导为用户拥有多个机构成员关系。
4. **每租户一个根机构，最大深度 4 级。** 普通创建不得创建第二个根，移动必须在事务中校验循环和深度。
5. **认证可以外部化，业务授权留在业务后端。** 前端只负责菜单、按钮和状态展示，不是安全边界。
6. **首期必须接入 IdP。** 优先复用企业现有 IdP；无现有 IdP 时采用 Keycloak + OIDC Authorization Code + PKCE，`MANUAL-01` 的产品结论已确认。
7. **权限采用 RBAC 功能权限 + 四种标准数据范围。** 仅使用 `self / org / org_subtree / all`，`custom` 延后；不在 MVP 阶段引入复杂 ABAC/ReBAC。
8. **审计事件从第一个写操作开始记录。** 高风险写操作使用 `audit_event_v1` + 事务性 Outbox，失败关闭；首期仅保存，不开放导出、归档或合规删除。
9. **原型按能力优先级和 HTML 原型优先级分层。** 原型采用 HTML；普通 CRUD 复用标准模式，机构树、权限矩阵、公告和审计详情先完成复杂 HTML 原型。
10. **首期开放租户自助管理。** `tenant_admin` 管理当前租户的组织、用户、租户级角色、字典、公告和审计查询；不得访问 `/platform/*` 或切换租户。
11. **参考成熟框架的能力和交互，不复制其代码、视觉或权限模型。**

## 3. 当前状态

本轮已在文档层完成 R2/R3 修订、R4 专家评审和 R4.1 执行同步，并由产品经理小张于 2026-11-15 批准产品方向与工程默认值（证据 `EVID-2026-11-15-PM-01`、`EVID-2026-11-15-PM-02`）。R5 按用户指令由专家团条件放行机构 API 契约适配层；随后按用户明确的前端-only 范围，已实现使用本地 fixtures 的机构、用户、角色、数据字典、公告和审计页面。真实 API 接入、RBAC 能力扩展和后端验收仍待完成：

- ADR-001 已改为多租户、用户单机构、单根四级，并补充 OIDC 中介、身份绑定、权限版本、会话版本和审计 Outbox。
- 权限矩阵已升级 v0.2，补充 `tenant_id`、四种标准数据范围、防提权和最后管理员事务不变量。
- 机构 API v0.2 和 OpenAPI 3.1 联合评审提案已补齐路径、Schema、示例、错误响应及权限/幂等/审计元数据，但仍是 `NOT FREEZABLE`。
- 交互文档已拆分能力/HTML 原型优先级，冻结规划级页面清单、8 类状态和稳定业务错误码映射。
- 已新增机构、权限矩阵、公告和审计 HTML 原型，并完成键盘、焦点恢复、320px 和 axe 自动验收；按 `MANUAL-12` 直接进入实现评审，不额外要求多角色签收、版本号或证据包，评审结论仍待记录。
- 已新增平台管理员身份、前端 RBAC 和 IdP 部署契约候选，用于关闭 R4-03、R4-05 和 R4-08 的设计歧义；这些文件不是技术签批或实现授权。
- 已新增 `audit_event_v1` Schema 和事件目录，统一机构启停事件为 `organization.status_changed`，并补充授权拒绝的独立安全审计通道。
- 已形成机构垂直切片 L3 任务契约草案；R5 已实现 `src/api/organizations` 契约适配层，并完成 `/system/organizations` 本地 fixture 前端切片（树、筛选、创建、编辑、移动、启停和键盘操作）。真实 API 接入仍为 `PENDING`。
- 已新增用户、角色、字典、公告、审计五个前端切片：模块页、路由、导航、中英文 i18n、领域模型、单测、E2E 与可访问性路由均已接入；五个模块只使用本地 fixtures，刷新后重置，不包含真实 API 请求。
- 已新增 `frontend-admin-slices.md`，把五个模块的需求、非目标、数据模型、状态转换、页面交互、无障碍、文件清单、未来 API 缺口和最短接入顺序收束为单一设计说明。
- R3 已由产品、身份安全、授权审计、后端 API 和前端 UX 五类专家按顺序评审，结论为 `BLOCK / NOT APPROVED`。
- 已新增页面契约矩阵，并补充稳定错误码、防提权公式、幂等状态机、结构锁和角色任务闭环。
- 已确认 IdP、JIT、租户自助管理与 `tenant_admin`、平台入口、角色归属、四种标准数据范围、只停用、审计仅保存、公告受众与已发布不可修改、页面私有树表、HTML 原型等全部人工决策；`ADMIN-OVERVIEW`、个人资料 API 和公告历史保留等产品细节仍在页面契约中列明待确认。
- `MANUAL-01` 至 `MANUAL-12` 已全部关闭；破窗仅要求受控内网 + MFA，原型仅要求 HTML。
- 机构 API 仍为 `NOT FREEZABLE`，等待后端真实 OpenAPI、技术签批和实现验证。
- 已修改 `src/**`：新增基础管理模块、共享枚举、路由/导航、i18n 与相关测试，并接入既有前端壳层。
- 未为用户、角色、字典、公告、审计新增真实 API 请求函数；`src/api/organizations` 仍是机构交接草案适配层，不代表五个新模块已有后端契约。
- 未修改认证、会话或既有后端 API 语义；新增页面统一消费现有 `requiresAuth + requiresAdmin`，未扩展 `AuthPermission`。
- 未实现 SSO/OIDC/SAML、服务端 RBAC、真实租户切换、审计投递或持久化。
- 已执行五个模块的单测、生产 E2E、axe 可访问性检查和构建检查，结果通过；完整 OpenAPI lint、真实后端联调和 JSON Schema 2020-12 验证仍待外部输入或工具。

首轮评审见 `review-report-2026-11-14.md`；R2 复审见 `review-report-2026-11-14-r2.md`；R3 五类专家评审见 `review-report-2026-11-14-r3.md`；当前 R4 专家团结论见 `review-report-2026-11-15.md`。前三份报告保留为历史证据，当前决策状态以 `decision-log.md` 为准。

## 4. 文档清单

| 文档 | 用途 | 状态 |
|---|---|---|
| `capability-map.md` | 六个业务域和横切能力地图、优先级、验收边界 | `PROPOSED` |
| `decision-log.md` | 唯一决策记录、工程默认值、人工决策和关闭规则 | `DRAFT / ALL MANUAL DECISIONS CONFIRMED` |
| `adr-001-identity-tenant-organization.md` | 多租户、身份、组织、RBAC、会话和审计边界 | `PROPOSED / ALL PRODUCT DECISIONS CONFIRMED` |
| `role-permission-matrix.md` | 权限码、角色、数据范围、授权断言和并发不变量 | `PROPOSED / PRODUCT DECISIONS CONFIRMED` |
| `organization-api-contract-v0.2.md` | 机构 API v0.2 候选契约 | `PROPOSED / CONTRACT CANDIDATE / PRODUCT DECISIONS CONFIRMED` |
| `organization.openapi.yaml` | 前端/后端联合评审用 OpenAPI 3.1 提案；不是后端契约 | `PROPOSED / BACKEND OPENAPI REQUIRED` |
| `organization.backend-openapi.yaml` | 基于规划文档生成的后端交接草案；完整 5 路径、7 操作、Schema、示例和实现约束 | `DRAFT / BACKEND RECONCILIATION REQUIRED` |
| `organization-api-contract-v0.1.md` | 历史 v0.1 草案 | `SUPERSEDED` |
| `interaction-and-reference.md` | 信息架构、关键流程、状态矩阵、参考软件和原型门禁 | `PROPOSED / ALL PRODUCT DECISIONS CONFIRMED` |
| `page-contract-matrix.md` | 页面 ID、路由键、权限、数据范围、API、可访问性和原型门禁 | `PROPOSED / FRONTEND SLICES IMPLEMENTED / REAL API GATES PENDING` |
| `frontend-admin-slices.md` | 用户、角色、字典、公告、审计五切片的从需求到设计说明、数据边界、文件清单与真实 API 缺口 | `FRONTEND LOCAL SLICES IMPLEMENTED / REAL API PENDING` |
| `organization-slice-l3-task.md` | 机构垂直切片 L3 任务契约：前端本地实现已完成，真实 API 接入仍待契约关闭 | `FRONTEND LOCAL SLICE IMPLEMENTED / REAL API PENDING` |
| `platform-admin-identity-proposal.md` | 平台管理员独立身份载体、平台权限和隔离验收候选 | `PROPOSED / SECURITY+BACKEND SIGN-OFF REQUIRED` |
| `frontend-rbac-contract-proposal.md` | 前端权限返回、路由元数据、失败关闭和迁移步骤候选 | `PROPOSED / BACKEND CONTRACT REQUIRED` |
| `idp-deployment-contract.md` | 企业 IdP/OIDC 部署契约模板 | `PROPOSED / TBD / SECURITY+IT SIGN-OFF REQUIRED` |
| `audit-event-v1.schema.json` | 审计事件信封 2020-12 草案 | `PROPOSED / SIGN-OFF REQUIRED` |
| `audit-event-catalog.md` | 机构事件目录、Outbox 状态机和验收场景 | `PROPOSED / SIGN-OFF REQUIRED` |
| `prototypes/admin-foundation/` | 机构、权限矩阵、公告和审计 HTML 原型及自动验收脚本 | `HTML PROTOTYPE / AUTOMATED VERIFICATION PASSED / IMPLEMENTATION REVIEW PENDING` |
| `prototype-implementation-review.md` | HTML 原型自动验收、截图检查和 G4 实现评审记录 | `AUTOMATED PASS / OWNER CONFIRMATION PENDING` |
| `shortest-path-execution.md` | G1-G5 最短推进路径、后端交接清单、联签决策包和停止条件 | `ACTIVE / G1 WAITING FOR BACKEND` |
| `expert-panel-decision-2026-11-15.md` | R5 专家团条件放行、允许范围、禁止范围与最短后续顺序 | `CONDITIONAL GO / CONTRACT ADAPTER ONLY` |
| `review-checklist.md` | 评审顺序、签收矩阵、跨文档一致性和开发硬门槛 | `PROPOSED / R4.1 EXECUTION SYNC` |
| `review-report-2026-11-14.md` | 首轮专家评审历史结论 | `HISTORICAL / NOT APPROVED` |
| `review-report-2026-11-14-r2.md` | R2 五类专家复审历史结论 | `HISTORICAL / NOT APPROVED` |
| `review-report-2026-11-14-r3.md` | R3 五类专家复审、修订记录和剩余人工决策 | `HISTORICAL / NOT APPROVED` |
| `review-report-2026-11-15.md` | R4 专家团全量评审、R4.1 执行更新、R5 契约适配执行记录 | `REVIEWED / R5 CONTRACT ADAPTER / PRODUCTION NO-GO` |

## 5. 推荐实现链路

前端-only 当前链路：

```text
产品决策确认（已完成）
→ HTML 原型与交互评审
→ 前端本地 fixture 基础管理切片（已实现：机构、用户、角色、字典、公告、审计；页面、导航、路由、i18n、单测、E2E）
→ 可访问性与构建验收
→ 真实 API 接入（等待后端 OpenAPI、RBAC 返回和联调授权）
```

真实后端接入链路：

```text
本目录材料评审（已完成 R3 修订）
→ 产品决策确认（已完成；MANUAL-01 至 MANUAL-12 全部关闭）
→ 后端补充机构 API 真实 OpenAPI
→ ADR-001 跨角色技术联签
→ 权限矩阵 v0.2 签收
→ 机构 API v0.2 提案与后端真实 OpenAPI 差异关闭
→ 机构关键流程 HTML 原型人工评审（自动验收已完成）
→ 机构垂直切片 L3 任务契约批准（草案已形成；另行授权）
→ 机构 API 契约适配层（R5 已实现；仅交接验证）
→ 后端真实契约差异关闭
→ 权限返回契约关闭（D-11）
→ 机构垂直切片实现
→ 用户与角色
→ 数据字典与公告
→ 审计日志查询
```

## 6. 生产与真实环境阶段门槛（非本轮验收）

- [x] IdP、JIT 已由产品经理小张批准并有证据；首期必须接入 IdP，不开放 JIT。
- [x] 破窗账号仅要求受控内网 + MFA；其他附加控制不作首期要求。
- [x] 开放租户自助管理并启用 `tenant_admin`；仅限当前租户。
- [x] 平台跨租户入口、角色定义归属、四种标准数据范围和页面私有树表已确认。
- [ ] `tenant_id` 已是所有租户级查询、权限、索引、缓存和审计的硬边界。
- [ ] 用户单机构、单根四级和机构移动事务语义已由后端确认。
- [ ] 权限码、数据范围、防提权和最后管理员事务不变量已签收。
- [ ] `permissions_version`、`session_version`、审计 Outbox 和失败关闭方案已签收。
- [ ] 机构 API v0.2 与后端真实 OpenAPI 对齐，OpenAPI lint 和示例 Schema 校验通过。
- [x] 首期只停用、审计仅保存、公告受众可组合且已发布不可原地修改已确认。
- [x] 原型采用 HTML；不额外要求多角色签收、版本号或证据包。
- [x] 已形成独立 L3 实现任务契约草案，列明允许修改路径、复用依据、测试命令和风险；最终批准仍待 G5。
- [x] HTML 原型已完成，并通过键盘、焦点恢复、320px 和 axe 自动验收；按 `MANUAL-12` 直接进入实现评审，不新增多角色签收、版本号或证据包要求，评审结论仍待记录。

未满足条目不阻塞本轮“前端契约适配 + mock 集成”验收；进入真实环境或生产上线阶段前仍需关闭。不得以页面 fixture、前端假权限或未确认端点绕过。

## 7. 依据与参考

- 仓库约束：`AGENTS.md`、`DESIGN.md`、`docs/architecture/*`、`docs/ai/*`。
- 当前实现：HttpOnly Cookie、会话状态机、`/auth/config` SSO 入口、`401/403`、CSRF、`is_admin`。
- 管理交互参考：Ant Design Pro、RuoYi-Vue3、ruoyi-vue-pro、Vben Admin、Soybean Admin、Arco Design Pro Vue。
- 身份权限参考：Keycloak、Casdoor、Authentik、Ory、Zitadel、Casbin、OpenFGA、SpiceDB。
- 最终 UI 与实现边界：本仓库 `DESIGN.md`、Nuxt UI 4、`U*` 适配器、`DataTablePattern`、`ComplexFormPattern`、`--gp-*` Token。
