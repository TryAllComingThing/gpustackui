# Codex 开发工作流

状态：`APPROVED`。本文件规定 Codex 在本仓库执行任务时的最小流程；不替代根 `DESIGN.md`、`AGENTS.md` 或 `.codex/skills/` 契约。

## 阅读顺序

1. 根 `AGENTS.md` 与 `DESIGN.md`。
2. `docs/ai/CONTEXT-MAP.md`。
3. 与本任务相关的 `.codex/skills/<skill>/SKILL.md` 与 `contract.json`。
4. 真实源码、测试、`package.json` 脚本和 CI 配置。
5. 本任务的 PRD/Spec、任务清单和允许修改路径。

## 执行流程

1. 确认目标、非目标、验收标准和风险。
2. 冻结 API、权限、认证、路由、异步状态和设计参考。
3. 写出允许修改文件清单；不在清单内的文件不得修改。
4. 按模块切片实现；API 放 `src/api/<domain>/`，跨模块公共 UI 放 `src/components/`。
5. 运行受影响检查，保留真实命令、退出码、日志和证据路径。
6. 更新文档、i18n、路由、API 契约和测试。
7. 输出变更摘要、失败证据、未执行检查和回滚方式。

## 禁止事项

- 不虚构后端端点、权限、认证行为或测试结果。
- 不创建第二套设计系统、主题引擎、`--ds-*` 命名空间或平行组件层。
- 不自动接受视觉基线、删除失败证据或把未执行检查写成 PASS。
- 不跨模块导入私有实现；模块公共入口为 `src/modules/<domain>/index.ts`。
- 不在没有任务契约和验收标准时直接开始业务实现。
