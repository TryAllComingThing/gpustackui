通用 Vue 3 + TypeScript SaaS 前端框架。

## 设计权威

- 根目录 `DESIGN.md` 是唯一活动设计规范；`docs/fusion/archive/` 只用于追溯，不是活动权威。
- 遵循 `docs/architecture/ARCHITECTURE.md`、`docs/quality/QUALITY-GATES.md` 和 `.codex/skills/` 下五个 Skill 契约。
- 不得创建第二套 DESIGN.md、项目 Profile、平行主题引擎或平行 `--ds-*` 运行时变量。
- 未审批的规范冲突必须标记 `PROPOSED`、`PENDING` 或 `DEFERRED`；不得自行冻结。

## 组件与主题规则

- 优先直接复用 Nuxt UI 4；跨页面能力只能通过薄 `Drp*` 适配器提供。
- 生产组件与 Showcase 必须复用同一 `src/components`、`src/theme`、Theme manager、Density manager 和 Typography/Layout manager。
- 所有组件必须遵循 `--gp-*` Token、`data-theme`、`data-density` 和现有公共 API；不得硬编码主题 HEX。
- Showcase 只使用本地 fixtures，不调用后端，不进入生产路由或生产包。
- 不得修改既有业务 API、权限、认证、后端契约语义。

## 质量与证据

- 不得未经实际退出码宣称测试、构建、视觉或无障碍通过。
- 每个质量报告必须记录命令、退出码、环境、报告/截图路径、失败证据和修复结果。
- `BLOCKED`：缺少前置条件、未批准决策、P0/P1、关键检查失败或证据缺失。
- `REVISE`：可修复的非关键问题；修复后重新执行受影响检查。
- `PASS`：所有必需检查真实通过、P0/P1 已关闭、人工批准已记录，并由有效 gate/state 证据写入。
- 浏览器、axe-core、截图和人工 WCAG 检查按当前任务要求执行；若任务明确豁免，必须记录 `NOT EXECUTED`，不得写成 PASS。

## 变更边界

- 先读取根 `DESIGN.md`、相关 Skill、真实源码和测试配置，再修改。
- 组件、Pattern、Theme、Density 或 Showcase 变更必须补充源码映射、状态矩阵和验证证据。
- 失败时保留日志和报告；不得自动接受视觉基线或删除失败证据。
