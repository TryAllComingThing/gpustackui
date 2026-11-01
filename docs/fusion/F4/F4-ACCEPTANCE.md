# F4 组件适配验收

状态：**PASS**。F4 所有已登记 P0/P1 缺陷均已关闭；严格自动化门禁、产品侧 WCAG/截图批准和技能状态链均已完成。

已完成：

- Button、Input、Select、Form、FormField、Table、Pagination、Modal、NavigationMenu、Breadcrumb、Checkbox、Card、Badge、Tabs、Toast、Empty、Loading、Error 均优先复用 Nuxt UI 4；没有建立第二套组件主题系统。
- `DrpSidebarNav`、`DrpBreadcrumb`、`DrpDataTable` 保持薄适配；旧 `AppSidebarNav`/`AppBreadcrumb` 仅保留兼容 Props 转发，不再有第二套实现。
- `DrpModal`、`DrpDrawer` 提供统一 `v-model:open`、标题描述、焦点和 Escape 行为契约；`DrpDataTable` 提供远程 `query` 事件且保留本地调用兼容。
- `ComplexFormPattern` 和 `DataTablePattern` 提供 Zod 跨字段校验、异步提交、搜索/筛选/排序/分页/行操作、错误/空/加载和响应式组合，均复用共享组件。
- 组件通过 `--gp-*` Token、五主题运行时和三档 Density Engine；表格加载状态增加 `aria-busy` 和屏幕阅读器状态提示。
- Showcase 使用本地 fixture，包含状态矩阵、稳定 `data-testid`、Dialog Escape、Toast、Tabs、表单错误/提交/重置/禁用和表格排序/分页/选择。
- 类型检查、Lint、单元测试、生产构建、Showcase 构建、Chromium 生产 E2E、Showcase Playwright、Chromium 语义/键盘、视觉命令、隔离检查和 diff 检查均有真实退出码 0 证据。
- 严格门禁 `pnpm test:strict` 在 Chromium、Firefox、WebKit 共 9 tests 通过，axe-core 无 violations，三浏览器视觉基线比对通过。
- 生产 GPU 资源页已迁移到 `DrpDataTable + UTable`，清除生产手写表格与共享契约分叉；F4-P1-007 已关闭。

验收依据：`docs/fusion/F4/F4-GATE-RESULT.json` 中 14 项门禁退出码均为 0；`docs/fusion/F4/F4-STATE.json` 引用该 gate 和 `F4-APPROVAL-RECORD.md`，批准人为小张，日期为 2026-11-01。
