# 专家团条件放行决策（R5）

- 决策 ID：`admin-foundation/expert-panel-r5`
- 日期：2026-11-15
- 决策输入：用户明确要求“由专家团直接推荐，不再等待人工逐项确认，立即开始”
- 结论：`CONDITIONAL GO / CONTRACT ADAPTER ONLY`
- 生产放行：`NO-GO`
- 性质：仓库内工程评审推荐，不是后端、安全、运维或合规的人类签批

## 1. 专家团推荐

由工程、架构、安全、测试和交付五个视角做仓库内评审，最短可推进路径是：

1. 立即实现机构 API 的 Zod 契约适配层、查询/请求映射、Header 校验和契约测试。
2. 同步补充 `412`、`428` 的错误归一化，并保留稳定的服务端业务错误码。
3. 不注册机构生产路由，不实现页面，不扩展 RBAC；这些动作继续等待真实后端能力返回和 G2/G3 结论。
4. 后端按 `organization.backend-openapi.yaml` 返回真实 OpenAPI 3.1，完成差异关闭后再把适配层接入模块。

理由：契约适配层可以在不改变认证、权限、路由和页面语义的前提下独立验证；它能把后端交接从文档评审推进到可执行检查，同时不制造“前端页面已经可用”的假象。

## 2. 本轮允许范围

- `src/api/organizations/**`：Schema、类型、查询映射、请求函数和公共出口。
- `src/services/http/errors.ts`：新增前置条件错误分类和安全业务码提取。
- `tests/unit/organization-*.spec.ts`、`tests/unit/http-errors.spec.ts`：契约与错误测试。
- `docs/architecture/API-CONTRACT.md`、`src/api/README.md` 和本目录相关状态文档。
- `eslint.config.js` 仅豁免浏览器原型目录，避免原型脚本被 Node 规则误报。

## 3. 明确不放行

- 不注册 `/admin/organizations` 或任何机构生产路由。
- 不创建机构页面、导航入口或菜单。
- 不修改 `AuthPermission`、`AuthUserSchema`、权限 guard 或 `/api/users/me` 语义。
- 不接入真实环境、不声称后端已实现、不声称 `Idempotency-Key`、`If-Match`、审计 Outbox 或事务已验证。
- 不把 `organization.backend-openapi.yaml` 升级为已签批后端契约。

## 4. 放行条件与关闭动作

| 条件 | 当前状态 | 关闭动作 |
|---|---|---|
| 机构 OpenAPI 3.1 交接草案 | `READY` | 后端确认或替换为真实 OpenAPI |
| API/Schema 契约测试 | `PASS` | 后端真实契约到位后增量更新并重跑 |
| 错误归一化 | `PASS` | 后端确认业务错误码枚举和 `request_id` 回传 |
| 认证/RBAC 返回契约 | `BLOCKED` | 关闭 D-11，提供版本化 `authorization` 或独立能力端点 |
| 技术联签 G2/G3 | `BLOCKED` | 后端、安全、运维/IT 完成具名签批 |
| 生产页面与路由 | `DENIED` | 完成真实契约、权限返回、代码级 E2E/可访问性后再申请 |

## 5. 最短后续顺序

1. 后端接收 `organization.backend-openapi.yaml`，返回真实 OpenAPI 3.1、lint 和示例校验结果。
2. 前端生成差异表，逐项关闭字段、错误码、Header、TTL、事务和审计语义。
3. 关闭 D-11 权限返回方式，再扩展 `AuthPermission` 与路由元数据。
4. 后端契约稳定后，将 `src/api/organizations` 从交接适配状态提升为生产契约。
5. 最后实现机构页面、E2E、可访问性和真实环境联调。

## 6. 工程判定

```text
全量软件开发：NO-GO
机构 API 契约适配层：CONDITIONAL GO / IMPLEMENTED
机构生产垂直切片：NO-GO
机构页面、路由、RBAC：DENIED
后端真实 OpenAPI：STILL REQUIRED
```

## 7. 本轮验证记录

已实际执行并通过：

```text
npm run typecheck
npm run lint
npm run test:unit
→ 23 个测试文件、139 个测试通过
npm run build
→ 生产构建通过
```

OpenAPI 交接草案机械检查：

```text
openapi=3.1.0
paths=5
operations=7
schemas=15
local_refs=171
missing_refs=0
duplicate_operation_ids=0
empty_responses=0
```

未执行：真实后端请求、Redocly/Spectral 完整 lint、JSON Schema 2020-12 示例校验、数据库事务、幂等 TTL、审计 Outbox、IdP、RBAC 和真实权限测试。上述未执行项不得描述为通过。
