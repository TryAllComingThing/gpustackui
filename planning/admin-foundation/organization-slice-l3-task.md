# 机构垂直切片 L3 实现任务契约（草案）

- 变更 ID：`admin-foundation/organization-slice`
- 状态：`FRONTEND CONTRACT ADAPTER + MOCK INTEGRATION ACCEPTED`
- 开发授权：`FRONTEND-ONLY ACCEPTANCE / REAL ENVIRONMENT OUT OF SCOPE`
- 本轮验收门禁：前端契约适配、页面接入、mock API 集成、静态检查与浏览器回归
- 目标文档：`organization-api-contract-v0.2.md`、`organization.openapi.yaml`、`interaction-and-reference.md`、`page-contract-matrix.md`
- 本文件把实现前骨架补成可评审任务。R5 先放行机构 API 契约适配层；随后按用户明确的前端-only 范围完成页面接入，并用 mock API 验证查询、创建、编辑、移动和启停。用户已确认本轮不需要真实环境联调。

## 1. 目标

实现机构管理垂直切片：授权范围内的机构树查看、创建、编辑、移动、停用和启用，并完整呈现加载、空、筛选无结果、`403`、`404`、业务冲突、版本冲突、网络错误和服务错误状态。

用户可见结果：

- 有 `iam:organization:read` 的用户可以查看授权范围内机构树和详情。
- 有对应动作权限且对象位于可写范围的用户可以创建、编辑、移动、停用和启用机构。
- 根节点、单根、四级、循环引用、版本冲突、幂等冲突和审计失败关闭有可观察行为。
- 无权限、范围外对象和不安全降级均失败关闭。

## 2. 任务级别

`L3`。原因：

- 新增受租户、RBAC 和四种数据范围约束的 API。
- 扩展 `AuthPermission`、路由访问元数据和前端能力消费方式。
- 涉及认证后的权限展示、失败关闭和页面路由。

## 3. 非目标

- 不实现用户、角色、字典、公告、审计查询。
- 不实现删除或恢复机构。
- 不实现 `/platform/*`、租户创建、租户删除或租户切换。
- 不实现 SSO/OIDC 协议、平台管理员身份载体或审计 Outbox 后端。
- 不实现自定义数据范围、批量导入、审批流或机构合并。
- 不创建公共树表适配器；机构树表首期保持页面私有。
- 不从 fixture 生成伪 API 响应，不把提案 YAML 当作后端契约。
- 不进行真实环境联调、真实数据迁移或生产部署验收。

## 4. 开始条件

### 4.0 前端契约适配与 mock 验收范围

本仓库是前端项目，不在本轮开发后端服务。当前已实现：

- [x] `/system/organizations` 页面、导航和路由，沿用 `requiresAuth + requiresAdmin`，不扩展 `AuthPermission`。
- [x] 机构树、搜索、状态/类型筛选、创建、编辑、移动、停用和启用。
- [x] 根保护、单根四级、循环移动、目标停用和活动子机构停用保护。
- [x] 中英文 i18n、键盘操作、320px 响应式布局和远端数据来源提示。
- [x] 树模型单测、生产路由 E2E 和生产可访问性路由覆盖。

本轮验收结论：

- [x] 用 `src/api/organizations/` 草案契约适配层替换模块内 fixtures，并覆盖 mock API 集成测试。
- [x] 页面覆盖 loading、empty、error、retry、版本冲突和写失败状态。
- [x] 前端发送 `Idempotency-Key`、`If-Match`，并在写成功后重新拉取树。

本轮非目标（不作为验收阻塞）：

- 真实后端 OpenAPI 对齐、RBAC 能力返回、真实双租户隔离。
- 真实幂等记录、事务、审计 Outbox 和真实环境性能验收。

生产上线门禁如下，不属于当前前端切片验收范围，也不阻塞本轮交付：

- [ ] 后端提供真实 OpenAPI 3.1 或等价 Schema，并与 `organization.openapi.yaml` 差异关闭。
- [ ] OpenAPI lint、请求/响应示例 Schema 校验和错误码枚举校验通过。
- [ ] 后端确认单根、四级、循环检测、结构锁、事务、幂等记录 TTL、权限版本和审计 Outbox 可实现。
- [ ] 安全确认 `tenant_id` 服务端注入、数据范围、防提权、`401/403/404`、最后管理员和审计失败关闭。
- [ ] 前端确认权限返回方式；不得用 `is_admin` 推导 `iam:organization:*`。
- [ ] 机构树、移动和启停 HTML 原型完成，并通过键盘、320px 窄屏和状态矩阵评审。
- [ ] `ADMIN-OVERVIEW` 访问对象已决定；本切片不得改变管理首页分流语义。
- [ ] 后端、安全、运维、前端完成本切片所需技术签批。

### 4.1 R5 契约放行与后续页面接入

依据 `expert-panel-decision-2026-11-15.md`，R5 首先只放行契约适配层；后续用户明确要求页面接入 API，并确认只需要契约适配与 mock 集成，因此当前范围包括：

- 实现 `src/api/organizations/**` 的 Schema、类型、请求映射和契约测试。
- 补充 `src/services/http/errors.ts` 的 `412/428` 映射和稳定业务错误码提取。
- 在既有 `/system/organizations` 页面接入树查询及写操作，并为 mock API 集成测试补齐错误和 Header 断言。
- 同步 API 契约文档和测试记录。

当前仍禁止：

- 修改 `AuthPermission`、`AuthUserSchema`、权限 guard 或 `/api/users/me` 契约。
- 声称真实环境字段、事务、审计 Outbox 或权限范围已经通过验收。

退出条件：后端真实 OpenAPI 与交接草案差异关闭，或后端明确要求替换 Schema；届时重新评审适配层并提升为生产契约。

## 5. API 契约

最终字段、Header 和错误码以后端真实 OpenAPI 为准。生产接入前必须冻结；当前 `src/api/organizations` 是按 `organization.backend-openapi.yaml` 交接草案实现的契约适配层：

| 方法 | 路径 | 用途 | 前端权限 |
|---|---|---|---|
| `GET` | `/organizations/tree` | 授权范围内树 | `iam:organization:read` |
| `GET` | `/organizations` | 扁平分页列表 | `iam:organization:read` |
| `GET` | `/organizations/{organization_id}` | 单对象详情 | `iam:organization:read` |
| `POST` | `/organizations` | 创建非根机构 | `iam:organization:create` |
| `PATCH` | `/organizations/{organization_id}` | 修改基础资料 | `iam:organization:update` |
| `POST` | `/organizations/{organization_id}/move` | 移动子树 | `iam:organization:move` |
| `POST` | `/organizations/{organization_id}/status` | 停用或启用 | `iam:organization:update-status` |

必须覆盖：

- 服务端注入租户，不接受客户端 `tenant_id`、`scope`、`all` 或 `platform_all`。
- `ETag/If-Match`；缺前置条件 `428`，版本过期 `412`，业务冲突 `409`。
- `Idempotency-Key` 的 pending、重放、同 key 不同 body 和 TTL 语义。
- 稳定错误码；前端不得解析 `message` 分支。
- `401` 清会话，`403` 禁止访问，范围外对象统一 `404`。
- 请求追踪 `X-Request-Id` 和错误详情中的 `request_id`。
- 未知错误码失败关闭，不进入成功态。

## 6. 权限与数据范围

实现时只消费后端确认后的能力或权限码：

- `iam:organization:read`
- `iam:organization:create`
- `iam:organization:update`
- `iam:organization:move`
- `iam:organization:update-status`

数据范围：

- 只允许 `org`、`org_subtree`、`all`；`all` 仅当前租户。
- 页面不得提交范围参数扩大授权。
- 每个写动作独立授权，不能用页面读权限或菜单可见性代替。
- `tenant_admin` 可在当前租户 `all` 范围管理；`org_admin` 按绑定范围使用后端已确认动作权限。
- `platform_admin` 不通过本切片接口旁路租户约束。

权限扩展要求：

- `AuthPermission` 从固定 token 扩展时必须保留未知 token 失败关闭。
- 路由元数据使用权限码，不使用角色名。
- 权限来源必须来自后端确认；不得在常量中猜测完整权限目录。
- 菜单隐藏、按钮禁用和路由 guard 都不是后端授权替代品。

## 7. 设计参考

- 页面主模式：树表格；窄屏切换为列表 + 详情或层级筛选。
- 创建/编辑：复用 `ComplexFormPattern` 的字段编排、错误关联和提交状态，模块内实现机构表单。
- 移动：键盘可访问对话框是主路径；拖拽仅增强。
- 状态变更：独立确认对话框，说明子节点、活动成员、影响用户和不可逆边界。
- 原型：`planning/admin-foundation/prototypes/admin-foundation/index.html`。
- 最终视觉与组件契约以 `DESIGN.md`、Nuxt UI 4、`--gp-*` Token 和现有 `U*` 适配器为准。

## 8. 复用检索与组件决策

已执行：

```text
npm run reuse:search -- organization
结果：No matches for "organization" in reusable source scopes.
```

决策：

| 能力 | 结论 | 理由 |
|---|---|---|
| 标准列表查询 | `REUSE DataTablePattern` | 远程搜索、筛选、页码重置已有契约 |
| 表单字段与错误 | `REUSE ComplexFormPattern` | 复用字段间距、错误摘要和提交状态 |
| 平面表格 | `REUSE UDataTable` | 仅用于扁平列表或窄屏列表 |
| 机构树表 | `NEW / 页面私有` | 当前 `UDataTable` 不承载递归树；首个真实复用前不公共化 |
| 移动/状态确认 | `REUSE UModal` | 使用 Nuxt UI 原语和焦点恢复 |
| 用户 Drawer | 不在本切片 | 用户模块后续处理 |

实现前重新执行 `reuse:search`；若已有新树表能力，必须改为 `REUSE/EXTEND` 并更新本表。

## 9. 允许修改路径

任务获批后仅允许修改：

- `src/api/organizations/index.ts`
- `src/api/organizations/schema.ts`
- `src/api/organizations/organization.ts`
- `src/api/organizations/types.ts`
- `src/modules/organizations/index.ts`
- `src/modules/organizations/routes.ts`
- `src/modules/organizations/pages/OrganizationListPage.vue`
- `src/modules/organizations/components/`（仅机构私有）
- `src/modules/organizations/composables/`（仅机构私有）
- `src/modules/organizations/types.ts`
- `src/app/router/routes.ts`
- `src/app/router/route-meta.d.ts`
- `src/app/router/access.ts`
- `src/app/navigation/nav.ts`
- `src/services/auth/permissions.ts`
- `src/stores/auth.ts`（仅消费后端确认的权限/能力字段）
- `src/types/auth.ts`
- `src/locales/zh-CN.ts`
- `src/locales/en-US.ts`
- `docs/architecture/AUTH-AND-PERMISSIONS.md`
- `docs/architecture/API-CONTRACT.md`
- `tests/unit/organization-*.spec.ts`
- `tests/integration/organization-*.spec.ts`
- `tests/e2e/organizations/*.e2e.ts`
- `tests/accessibility/organization*.spec.ts`

禁止修改：

- `src/api/**` 中机构以外领域。
- 用户、角色、字典、公告、审计页面或 API。
- `src/theme/tokens/**`、生成主题 CSS 或其他设计系统源。
- `src/components/common/UDataTable.vue`、`src/components/patterns/ComplexFormPattern.vue`，除非另行批准公共扩展。
- `docs/architecture/` 中未被本任务同步的契约文件。

## 10. 测试命令

实现后至少执行：

```text
npm run reuse:search -- organization-tree
npm run typecheck
npm run lint
npm run test:unit -- tests/unit/organization-api.spec.ts tests/unit/organization-schema.spec.ts tests/unit/auth-contract.spec.ts
npm run test:e2e -- tests/e2e/organizations/organizations.e2e.ts
npx playwright test --config playwright.accessibility.config.ts tests/accessibility/organization.accessibility.spec.ts
npm run build
```

按实际新增文件调整命令；未执行项必须列出原因。不得宣称未运行的测试通过。

## 11. 测试覆盖

- Schema：真实响应、未知字段策略、错误外壳和未知错误码失败关闭。
- 路由：`authenticated`、有读权限、无读权限、未知权限 token、`401/403/404`。
- 数据范围：双租户、`org`、`org_subtree`、`all`、范围外详情与计数。
- 机构树：展开、折叠、搜索、祖先上下文、空、筛选无结果、停用节点开关。
- 写操作：创建、编辑、移动、停用、启用、`428/412/409`、幂等重放和同 key 不同 body。
- 业务不变量：单根、四级、循环、根保护、活动子节点、活动成员。
- 审计：写操作请求带 `X-Request-Id`，服务端 Outbox 失败时前端不显示成功；前端不伪造审计事实。
- 可访问性：键盘移动、焦点恢复、错误摘要、320px 无页面级横向滚动、状态不只依赖颜色。

## 12. 完成条件

- [x] 草案字段、错误外壳和 Header 已同步到 Zod Schema，并通过契约单测。
- [x] 机构树、创建、编辑、移动、停用和启用主流程在 mock API 下可用。
- [x] 所有前端失败状态可观察；`412/428/409` 与网络错误不会进入成功态。
- [x] 沿用既有 `requiresAdmin`，不虚构细粒度权限码；真实能力返回属于后续阶段。
- [x] 前端 `Idempotency-Key`、`If-Match` 和写后刷新行为通过 mock 集成验证。
- [x] 键盘、窄屏、屏幕阅读器和减少动画要求通过。
- [x] 文档、i18n、路由、API 契约和测试同步。
- [x] `typecheck`、`lint`、unit、E2E、accessibility 和 build 结果如实记录。

## 13. 后续真实环境风险与回滚（非本轮阻塞）

- 风险：权限扩展错误放行。缓解：未知 token 失败关闭，保留现有 `is_admin` 兼容测试，新增 RBAC 拒绝测试。
- 风险：机构移动导致范围与缓存不一致。缓解：后端事务、结构锁和权限版本测试先行。
- 风险：幂等重放或版本冲突被误判成功。缓解：稳定错误码与客户端不自动重写规则。
- 风险：树表引入窄屏横向滚动或键盘不可用。缓解：原型和代码级可访问性测试双门禁。
- 回滚：移除机构模块路由注册和 `src/api/organizations`，恢复权限 token 至变更前版本；保留文档和后端契约修订记录用于复盘。

## 14. 真实环境阶段事项（非本轮验收）

| 事项 | 当前状态 | 需要谁提供 | 交付物 |
|---|---|---|---|
| G1 真实 OpenAPI | `DEFERRED / OUT OF SCOPE` | 后端 | OpenAPI 3.1、lint 结果、示例校验、差异关闭记录 |
| G2 技术联签 | `DEFERRED / OUT OF SCOPE` | 后端/安全/运维/前端 | 具名签批矩阵与证据链接 |
| G3 授权策略 | `DEFERRED / OUT OF SCOPE` | 安全/后端/IT/运维 | `platform_admin` 载体、可委派权限、最后管理员和 IdP 部署契约 |
| G4 HTML 原型评审 | `EVIDENCE READY` | 实现评审负责人 | 实现评审结论；按 `MANUAL-12` 不额外要求多角色签收、版本号或证据包 |
| G5 生产上线批准 | `DEFERRED / OUT OF SCOPE` | 交付负责人 | 进入真实环境阶段时另行签批 |

以上事项用于后续真实环境阶段，不影响当前前端契约适配与 mock 集成验收。

## 15. 生产上线签批记录（非本轮验收）

以下记录只用于后续生产上线，不代表当前前端 mock 验收的批准条件。

| 门禁 | 当前状态 | 签批人 | 日期 | 证据 | 结论 |
|---|---|---|---|---|---|
| G1 真实 OpenAPI | `OUT OF SCOPE` | 待填写 | — | 真实 OpenAPI、lint、示例校验、差异表 | `DEFERRED` |
| G2 技术联签 | `OUT OF SCOPE` | 后端/安全/运维/前端 | — | 联签决策包 | `DEFERRED` |
| G3 授权与身份 | `OUT OF SCOPE` | 安全/后端/IT/运维 | — | D-01 至 D-12 决策证据 | `DEFERRED` |
| G4 HTML 原型评审 | `OUT OF SCOPE` | 实现评审负责人 | — | 实现评审记录 | `DEFERRED` |
| G5 生产上线批准 | `OUT OF SCOPE` | 交付负责人 | — | 进入真实环境阶段时另行签批 | `DEFERRED` |

R5 实现授权记录：

| 记录 | 状态 | 来源 | 日期 | 证据 | 范围 |
|---|---|---|---|---|---|
| R5 契约适配层 | `CONDITIONAL PASS` | 用户指令与专家团工程推荐 | 2026-11-15 | `expert-panel-decision-2026-11-15.md`、unit/typecheck/lint/build 结果 | 仅 `src/api/organizations`、错误映射、测试和文档 |
| 前端契约适配 + mock 集成 | `ACCEPTED` | 用户明确验收口径 | 2026-11-19 | typecheck、lint、171 个单测、28 个 E2E、5 个可访问性测试与 build | 页面接入、mock API、错误/Header 断言和文档 |
