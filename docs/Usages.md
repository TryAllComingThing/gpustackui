# 使用指南：基于框架与 Codex 开发

本文件说明如何在本框架基础上使用 Codex 开发真实业务功能。它不替代 `AGENTS.md`、`DESIGN.md`、架构文档或任务契约；发生冲突时，以权威来源和真实源码为准。

## 1. 推荐思路

把 Codex 当作受任务契约约束的开发工程师，而不是让它自由重构整个仓库。开发时遵循以下原则：

1. **契约优先**：先明确目标、非目标、API、权限、完成条件和允许修改路径。
2. **复用优先**：先搜索现有组件、Composable、Service，再决定 `REUSE`、`EXTEND` 或 `ADD`。
3. **按模块切片**：每个需求只修改一个业务域，避免跨模块扩散。
4. **证据驱动**：以真实测试、类型检查、构建退出码作为完成依据。
5. **先分析再实现**：第一轮让 Codex 只读源码并给出计划，确认后再修改代码。

开始任务前必须读取：

1. [`AGENTS.md`](../AGENTS.md)
2. [`DESIGN.md`](../DESIGN.md)
3. [`docs/ai/CONTEXT-MAP.md`](ai/CONTEXT-MAP.md)
4. [`docs/ai/CODEX-WORKFLOW.md`](ai/CODEX-WORKFLOW.md)
5. [`docs/ai/TASK-CONTRACT.md`](ai/TASK-CONTRACT.md) 与 [`docs/ai/TASK-LEVELS.md`](ai/TASK-LEVELS.md)
6. 与任务相关的 Skill、架构文档、真实源码和测试

## 2. 首次接入

在框架根目录启动 Codex，确保它能自动读取仓库级 `AGENTS.md`、设计规范和 AI 上下文。

```bash
cp .env.example .env.local
npm install
npm run dev
```

在 `.env.local` 中配置真实产品：

```dotenv
VITE_APP_NAME=你的产品名称
VITE_API_BASE_URL=/v2
VITE_AUTH_BASE_URL=
VITE_APP_BASE=/
VITE_ENABLE_DEMO_MODULES=false
VITE_ENABLE_GPUSTACK_EXAMPLE=false
VITE_SSO_LOGIN_URL=
```

`VITE_ENABLE_DEMO_MODULES=false` 时，生产壳层只保留 Dashboard 和 Settings，不会注册使用本地 fixtures 的演示业务模块。接入真实业务后，应保持演示模块关闭。

需要开发共享组件或检查视觉状态时，启动独立 Showcase：

```bash
npm run dev:showcase
```

## 3. 标准开发闭环

### 3.1 创建任务档案

每个真实需求建立独立目录：

```text
planning/<change-id>/
  prd.md
  spec.md
  technical-design.md
  tasks.md
```

模板位于 [`planning/_template/`](../planning/_template/)。任务档案至少应明确：

- 用户可见目标；
- 非目标；
- 可观察、可测试的完成条件；
- API 契约；
- 设计参考；
- 允许修改路径；
- 复用依据；
- 测试命令；
- 风险。

完整字段定义见 [`docs/ai/TASK-CONTRACT.md`](ai/TASK-CONTRACT.md)。

### 3.2 向 Codex 提交任务契约

可以直接使用以下提示词，并按真实需求替换占位内容：

```text
请在仓库根目录工作，并先读取：
AGENTS.md、DESIGN.md、
docs/ai/CODEX-WORKFLOW.md、
docs/ai/CONTEXT-MAP.md、
docs/ai/TASK-CONTRACT.md、
docs/ai/TASK-LEVELS.md，
以及相关架构文档和真实源码。

任务：新增「订单管理」模块和订单列表页。
任务级别：L2。
目标：用户可以通过 /orders 查看、搜索和分页浏览订单。
非目标：不修改现有认证、权限、主题引擎和后端语义。
完成条件：
- 具备 loading、empty、error、retry 状态；
- 路由、导航、面包屑和中英文文案完整；
- 使用 Nuxt UI/U* 组件和 --gp-* Token；
- 有单元测试并通过 typecheck、lint、test:unit、build。

API 契约：
GET /v2/orders?page=1&perPage=20&search=&status=
响应必须由 Zod 校验。
如果契约信息不足，不要虚构端点，先列出缺失项。

允许修改：
src/modules/orders/**
src/api/orders/**
src/app/router/routes.ts
src/locales/zh-CN.ts
src/locales/en-US.ts
tests/unit/**
tests/e2e/**

请先执行复用检索，声明 REUSE/EXTEND/ADD，
然后只给分析和文件级实施计划，不要立即改代码。
```

示例中的 API、路由和路径仅用于展示契约写法，不能作为未确认的后端事实。

### 3.3 先确认方案，再批准实现

第一轮 Codex 应输出：

- 任务分级和风险；
- 复用检索结果；
- 计划修改的文件；
- API 和数据流；
- 组件、Token 和状态矩阵；
- 测试命令。

确认方案后再批准实现：

```text
按上述计划实施。只修改已批准路径；
使用 Nuxt UI 原语和现有 U* 适配器；
完成后运行 typecheck、lint、test:unit、build，
并报告实际执行的命令、退出码和未执行项。
```

如果 Codex 计划扩大到其他模块、认证、权限、API 契约或主题 Token，应先升级任务级别并重新确认范围。

### 3.4 创建模块骨架

新增能力前先检索现有实现：

```bash
npm run reuse:search -- DataTable
npm run reuse:search -- auth
```

只有确认没有合适实现后，才创建模块：

```bash
npm run create:module -- orders --with-types --with-api --with-test
```

生成器会建立 `src/modules/orders/`、路由、i18n key 和可选测试。生成结果仍需按真实 API 和设计契约审查，不能直接视为完成。

### 3.5 按固定顺序实现

```text
API 契约与 Zod Schema
  → 模块页面
  → 路由、导航、权限 meta
  → 中英文文案
  → 组件状态与可访问性
  → 单元、集成、E2E 测试
  → 文档同步
```

关键路径：

| 内容 | 位置 |
|---|---|
| 领域 API 与 Schema | `src/api/<domain>/` |
| 页面 | `src/modules/<domain>/pages/` |
| 模块路由 | `src/modules/<domain>/routes.ts` |
| 模块公共出口 | `src/modules/<domain>/index.ts` |
| 路由元数据类型 | `src/app/router/route-meta.d.ts` |
| 路由汇总 | `src/app/router/routes.ts` |
| 跨模块公共 UI | `src/components/` |
| 通用 Composable | `src/composables/` |
| 产品配置 | `src/config/product.ts` |

实现时遵守：

- 页面不直接拼装 URL，请求必须经过 `src/services/http`。
- API 响应使用 Zod 或等价 Schema 校验。
- 优先直接使用 Nuxt UI 4 原语。
- 只有跨页面状态、无障碍、递归装饰或稳定 DOM 契约才增加薄 `U*` 适配器。
- 业务组件只消费 `--gp-*` Token，不硬编码主题 HEX。
- 模块私有实现不得被其他模块直接导入。
- 共享组件至少有两个模块的真实复用需求。
- 路由、导航、标题和面包屑使用同一份 `meta` 契约。
- 中英文 i18n key 必须同步存在。
- loading、empty、error、retry、disabled、键盘和焦点行为不能遗漏。

## 4. 验证矩阵

普通业务模块至少执行：

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

涉及页面行为时补充：

```bash
npm run test:e2e
```

涉及共享组件或视觉状态时补充：

```bash
npm run typecheck:showcase
npm run build:showcase
npm run test:showcase-smoke
npm run test:accessibility
```

涉及主题、Token 或映射时补充：

```bash
npm run generate:theme-css
npm run check:theme-css
npm run check:tokens
```

任务分级和最低检查范围见 [`docs/ai/TASK-LEVELS.md`](ai/TASK-LEVELS.md)。未执行的检查必须标记为 `NOT EXECUTED` 并说明原因，不能描述为通过。

## 5. 预期效果

采用这套流程后，每个需求会形成稳定产物：

- 一个边界清晰的业务模块；
- 一份经过 Schema 校验的 API 契约；
- 一条可访问、带权限元数据的路由；
- 中英文完整文案；
- loading、empty、error、retry 等完整状态；
- 对应单元测试和页面测试；
- 与框架主题、组件和 Showcase 一致的设计行为；
- Codex 交付时列出真实修改文件、检查命令、退出码和剩余风险。

这样可以避免业务增长后出现每页一套表格、每模块一套主题、每页直接拼 URL 的平行实现，也能让 Codex 产出更容易评审和回归。

## 6. 变更边界

- 后端端点、权限 token 和认证行为必须由真实契约提供，不允许推测。
- 演示模块的 fixtures 不能进入真实生产数据链路。
- 认证、权限、路由语义、API 契约、主题 Token 和跨模块公共能力属于 L3，必须执行更完整的审查和测试。
- 主题 CSS 只能从 Token 源生成，不能手改。
- 不创建第二套设计系统、主题引擎、项目 Profile 或平行 `--ds-*` 命名空间。
- 不以前端路由保护替代后端授权。
- 不隐藏失败日志、不自动接受视觉基线、不删除失败证据。

## 7. 建议的首次迭代

第一个真实任务建议选择一个列表页或详情页，并完整走通以下闭环：

1. 配置 `.env.local` 并运行生产壳层；
2. 建立 `planning/<change-id>/` 任务档案；
3. 让 Codex 只读审计现有页面、API 和可复用能力；
4. 提交完整任务契约并要求先给计划；
5. 创建单个业务模块；
6. 接入真实 API 契约并实现页面；
7. 同步路由、i18n、测试和文档；
8. 执行受影响检查并记录证据；
9. 按 [`docs/ai/REVIEW-CHECKLIST.md`](ai/REVIEW-CHECKLIST.md) 进行评审；
10. 稳定后再并行开发多个业务模块。
