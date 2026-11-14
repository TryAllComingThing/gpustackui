通用 Vue 3 + TypeScript + Vite + Nuxt UI 前端框架，同时作为 AI 编码知识库。

## 权威来源

- 根目录 `DESIGN.md` 是唯一活动设计规范。
- 架构与边界以 `docs/architecture/ARCHITECTURE.md` 为准。
- 三个 Skill 位于 `.codex/skills/`：设计系统、页面迁移、仓库审计。
- 开始任务前必须读取 `docs/ai/CODEX-WORKFLOW.md`、`docs/ai/CONTEXT-MAP.md` 和 `docs/ai/TASK-CONTRACT.md`。
- 不得创建第二套 `DESIGN.md`、项目 Profile、平行主题引擎或平行 `--ds-*` 运行时变量。

## 组件与主题

- 优先直接复用 Nuxt UI 4；跨页面能力只能通过薄 `U*` 适配器提供。
- 生产组件与 Showcase 必须复用同一 `src/components`、`src/theme`、Theme/Density/Appearance manager 和 Typography/Layout manager。
- 所有组件必须遵循 `--gp-*` Token、`data-theme`、`data-density`、`data-appearance` 和现有公共 API；不得硬编码主题 HEX。
- Showcase 只使用本地 fixtures，不调用后端，不进入生产路由或生产包。
- 不得修改既有业务 API、权限、认证或后端契约语义。

## 开发流程

- 先确认目标、非目标、完成条件和允许修改的路径，再开始实现。
- 新增组件、Composable、Utils 或 Service 前运行 `npm run reuse:search -- <能力关键词>`，优先 REUSE / EXTEND。
- 按模块切片实现：API 放 `src/api/<domain>/`，模块公共出口放 `src/modules/<domain>/index.ts`，跨模块 UI 放 `src/components/`。
- 改动后运行受影响的 typecheck、lint、unit、E2E、accessibility 或 build 命令；只描述实际执行过的结果。
- 同步相关文档、i18n、路由、API 契约和测试。

## 变更边界

- 不虚构后端端点、权限、认证行为或测试结果。
- 不跨模块导入私有实现；不复制 Nuxt UI 原语。
- 不手改生成主题 CSS；先修改 Token 源和映射，再运行生成脚本。
- 不把页面私有逻辑上移到公共层，除非已有两个以上模块的真实复用需求。
- 保留现有可访问性、键盘行为和失败关闭语义。
