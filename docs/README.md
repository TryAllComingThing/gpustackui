# 文档索引

本目录保存框架架构、设计系统、AI 编码工作流和任务模板。根 `DESIGN.md` 是唯一活动设计规范，真实源码是最终事实来源。

## AI 编码

| 文档 | 作用 |
|---|---|
| `docs/Usages.md` | 基于框架与 Codex 的完整开发流程、提示词与验收步骤 |
| `docs/ai/CODEX-WORKFLOW.md` | 阅读顺序、执行流程与变更边界 |
| `docs/ai/CONTEXT-MAP.md` | 权威来源、事实源与上下文索引 |
| `docs/ai/TASK-CONTRACT.md` | 任务开始前需要明确的字段 |
| `docs/ai/TASK-LEVELS.md` | L1/L2/L3 变更分级与检查范围 |
| `docs/ai/REUSE-GUIDE.md` | 复用检索命令与 REUSE / EXTEND / ADD 决策 |
| `docs/ai/REVIEW-CHECKLIST.md` | 代码评审清单 |

## 架构

| 文档 | 作用 |
|---|---|
| `docs/architecture/ARCHITECTURE.md` | 分层、入口、模块边界与运行时 |
| `docs/architecture/API-CONTRACT.md` | API 层职责、错误、Schema 与端点规则 |
| `docs/architecture/AUTH-AND-PERMISSIONS.md` | 认证、会话、CSRF、路由保护与权限 |

## 设计

| 文档 | 作用 |
|---|---|
| `DESIGN.md` | 唯一活动设计规范 |
| `docs/design/FRAMEWORK-GUIDE.md` | 设计思路、组件决策树与状态矩阵 |
| `docs/design/TOKEN-MAPPING.md` | Token 管线、兼容 alias 与关键值 |
| `docs/design/THEME-CONTRACT.md` | 五主题、Appearance、源映射与生成文件 |
| `docs/design/COMPONENT-MATRIX.md` | Nuxt UI 原语、`U*` 适配器与 Showcase 覆盖 |

## 模板

| 文档 | 作用 |
|---|---|
| `docs/templates/ADR.md` | 架构决策记录 |
| `docs/templates/API.md` | API 任务模板 |
| `docs/templates/COMPONENT.md` | 组件任务模板 |
| `docs/templates/MODULE.md` | 模块任务模板 |
| `docs/templates/PAGE.md` | 页面任务模板 |
| `planning/README.md` | PRD、Spec、技术设计与任务模板说明 |

## 推荐阅读路径

- 新功能：`README.md` → `DESIGN.md` → `docs/architecture/ARCHITECTURE.md` → 相关模块与测试。
- 页面迁移：`docs/ai/CODEX-WORKFLOW.md` → `docs/ai/REUSE-GUIDE.md` → `.codex/skills/gpustack-page-migration/SKILL.md`。
- 设计系统：`DESIGN.md` → `docs/design/` → `.codex/skills/gpustack-design-system/SKILL.md`。
- 存量仓库分析：`.codex/skills/gpustack-repo-audit/SKILL.md` → `docs/architecture/`。
