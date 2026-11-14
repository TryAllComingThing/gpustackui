# Codex 上下文地图

## 权威顺序

| 顺序 | 文件/目录 | 用途 |
|---:|---|---|
| 1 | `AGENTS.md` | 仓库级硬约束与变更边界 |
| 2 | `DESIGN.md` | 唯一活动设计规范 |
| 3 | `docs/architecture/ARCHITECTURE.md` | 分层、入口与边界 |
| 4 | `docs/architecture/API-CONTRACT.md` | API 层职责、错误、Schema 与端点规则 |
| 5 | `docs/architecture/AUTH-AND-PERMISSIONS.md` | 认证、会话、CSRF、权限与路由保护 |
| 6 | `docs/ai/TASK-LEVELS.md` | L1/L2/L3 变更分级与检查范围 |
| 7 | `.codex/skills/` | 设计系统、页面迁移与仓库审计 Skill |
| 8 | `docs/design/` | Token、主题、组件矩阵和框架指南 |
| 9 | `planning/` | PRD、Spec、技术设计与任务清单 |
| 10 | 真实源码与测试 | 最终事实来源；文档冲突时以源码为准并修正文档 |

## 事实源

- 版本：`package.json` 的 `version`。
- 设计 Token：`src/theme/tokens/`。
- 生成运行时样式：`src/theme/styles/themes/*.css`，包括五主题与 `appearance.css`，由脚本生成。
- 路由：`src/app/router/routes.ts` 汇总各模块 `routes.ts`。
- 导航：`src/app/navigation/nav.ts` 从路由 `meta.nav` 派生。
- API 契约：`src/api/<domain>/`。
- 模块公共出口：`src/modules/<domain>/index.ts`。
- 产品配置：`src/config/product.ts`、`src/config/product-env.ts` 和 `.env.example`；演示业务模块默认关闭，子路径与 SSO 入口由环境变量配置。
- Appearance Token：`src/theme/tokens/appearance.json`；运行时写入 `data-appearance`、`data-appearance-preference` 与兼容 `dark` class。

## 不应作为实现依据

- `dist/`、`dist-showcase/`、`dist-e2e/` 等构建产物。
- Playwright 报告、测试结果目录和截图。
- `components.d.ts`、`auto-imports.d.ts` 等工具生成文件；需要时由工具链重新生成。
- 已经删除或被新文档替代的历史计划、报告和旧命令。
- 与 `DESIGN.md`、真实源码或测试冲突的旧说明。
