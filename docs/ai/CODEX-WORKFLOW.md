# Codex 开发工作流

本文件规定 Codex 在本仓库执行任务时的最小流程，不替代 `AGENTS.md`、`DESIGN.md`、架构文档或 Skill 契约。

## 阅读顺序

1. 根 `AGENTS.md` 与 `DESIGN.md`。
2. `docs/ai/CONTEXT-MAP.md`。
3. 本文件、`TASK-CONTRACT.md` 和 `TASK-LEVELS.md`。
4. 与本任务相关的 `.codex/skills/<skill>/SKILL.md`。
5. 真实源码、测试、`package.json` 脚本和构建配置。
6. 本任务的 PRD/Spec、技术设计和任务清单。

## 执行流程

1. 明确目标、非目标、完成条件和风险。
2. 按 `TASK-LEVELS.md` 声明 `L1`、`L2` 或 `L3`；高风险变更不得降级。
3. 确认现有 API、权限、认证、路由、异步状态和设计契约；未提供契约时只做 Schema 或占位，不虚构请求。
4. 运行 `npm run reuse:search -- <能力关键词>`，检查现有组件、Composable、Utils、Service 和模块能力；优先 REUSE / EXTEND。
5. 列出计划修改的文件或目录，保持变更范围聚焦。
6. 按模块切片实现；API 放 `src/api/<domain>/`，跨模块公共 UI 放 `src/components/`，页面私有逻辑留在模块内。
7. 运行受影响检查：typecheck、lint、unit、integration、E2E、showcase、accessibility 或 build。
8. 同步文档、i18n、路由、导航、API 契约和测试。
9. 输出变更摘要、已执行命令、未执行项和已知风险；未运行的检查不得描述为通过。

## 禁止事项

- 不虚构后端端点、权限、认证行为或测试结果。
- 不创建第二套设计系统、主题引擎、`--ds-*` 命名空间或平行组件层。
- 不把页面私有逻辑复制到公共层。
- 不跨模块导入私有实现；模块公共入口为 `src/modules/<domain>/index.ts`。
- 不手改 `src/theme/styles/themes/*.css`；先改 Token 源并运行生成脚本。
- 不在缺少目标或完成条件时直接开始大范围重构。
