# Codex 上下文地图

## 权威顺序

| 顺序 | 文件/目录 | 用途 |
|---:|---|---|
| 1 | `AGENTS.md` | 仓库级硬约束、质量与变更边界。 |
| 2 | `DESIGN.md` | 唯一活动设计规范。 |
| 3 | `docs/architecture/ARCHITECTURE.md` | 当前真实分层与边界。 |
| 4 | `docs/architecture/API-CONTRACT.md` | API 层职责、错误、Schema 与契约规则。 |
| 5 | `docs/architecture/AUTH-AND-PERMISSIONS.md` | 认证与权限当前状态、待决项和启用条件。 |
| 6 | `.codex/skills/` | 设计、迁移、审计、视觉与发布 Skill 契约。 |
| 7 | `docs/design/` | Token、主题、组件矩阵和框架指南。 |
| 8 | `docs/quality/` | 门禁、证据和缺陷清单。 |
| 9 | `planning/` | 当前任务的 PRD、Spec、设计和任务清单。 |
| 10 | 真实源码与测试 | 最终事实来源；文档冲突时必须报告。 |

## 事实源

- 版本：`package.json` 的 `version`。
- 设计 Token：`src/theme/tokens/`。
- 生成主题：`src/theme/styles/themes/*.css`，由脚本生成。
- 路由：`src/app/router/routes.ts` 汇总各模块 `routes.ts`。
- 导航：`src/app/navigation/nav.ts` 从路由 `meta.nav` 派生。
- API 契约：`src/api/<domain>/`。
- 模块公共出口：`src/modules/<domain>/index.ts`。
- 质量证据：`docs/quality/`。

## 过期或不可作为实现依据

- 任何没有当前退出码的 PASS 报告。
- 被标记为 `PROPOSED`、`PENDING`、`DEFERRED` 但尚未批准的规则。
- 归档设计稿、旧组件前缀和旧 `--ds-*` 变量。
