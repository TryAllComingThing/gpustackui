# GPUStack UI Design System V2.4（项目覆盖层）

> 状态：F1 项目覆盖决策已由小张（设计、产品、架构、无障碍责任人）于 2026-11-01 批准；实现和质量门禁状态继续以 F1 验收记录为准。通用规范见 `design-system/DESIGN.md`；冲突决策见 `docs/fusion/F1/adr/ADR-INDEX.md`；原始版本备份见 `docs/fusion/F1/archive/GPUSTACK-DESIGN-original.md`。

## 1. GPUStack 项目定位

GPUStack 是单生产应用、模块化业务前端。SaaS V1.1 作为通用规范层，本文件只记录 GPUStack 差异、覆盖和当前运行时边界。不得修改原 React API、权限、路由语义或后端契约。Showcase 是独立开发/验收入口，不属于生产路由或生产构建。

## 2. 通用规范引用与权威顺序

权威层级（ADR-D01，状态 `APPROVED`）：

1. 安全和无障碍约束；
2. `design-system/DESIGN.md` 及其 Token/矩阵资产；
3. 本文件的 GPUStack 项目覆盖；
4. `src/theme`、共享组件适配层和 Nuxt UI 默认值。

本文件不复制通用规范中的 HEX、字号或间距数值；需要引用时指向 `design-system/tokens/`、`design-system/contracts/` 或本项目 `src/theme` 文件。

## 3. GPUStack 主题 ID 映射

现有主题 ID 保留（ADR-D02，`APPROVED`）：`standard`、`business`、`future`，并按已批准的五主题决策扩展 `sky`、`ocean`；定义见 `src/theme/theme.types.ts:1`、`src/theme/theme.registry.ts` 和 `src/theme/styles/themes/*.css`。

已确认的值映射（只记录映射，不复制色值）：

- SaaS A2 ↔ GPUStack business；
- SaaS D ↔ GPUStack future；
- SaaS E ↔ GPUStack standard。

SaaS B/C 分别映射为 GPUStack `sky`、`ocean`，设计源为 `design-system/tokens/themes/B.json`、`C.json`，运行时 CSS 为 `src/theme/styles/themes/sky.css`、`ocean.css`。ADR-D03 已由小张于 2026-11-01 批准。

主题运行时继续使用 `src/theme/theme.manager.ts:3-20` 的 `data-theme` 和 localStorage 机制；主题切换不得改变业务状态。

## 4. Header、Sidebar、Breadcrumb 特例

- Header 高度保留 60px（ADR-D04，`APPROVED`），使用现有 `--gp-header-height`，依据 `src/theme/styles/tokens.css:13`。
- Sidebar 保留展开 200px、折叠 64px（ADR-D05，`APPROVED`），使用现有 `--gp-sidebar-width`/`--gp-sidebar-collapsed-width`。这是对 SaaS 232/64 的项目覆盖。
- Breadcrumb 保留在 Header 内（ADR-D06，`APPROVED`），生产路由已通过 `AppShell.vue` + `AppBreadcrumb.vue` 接入；不得在工作区重复。动态路由元数据、导航折叠和刷新恢复由生产 E2E 覆盖，`DrpBreadcrumb.vue` 继续作为共享适配层。
- Header 使用 `--gp-header-bg`/`--gp-header-fg`；Sidebar 使用 `--gp-sidebar-bg`/`--gp-sidebar-fg`；具体颜色仍以 `src/theme/styles/themes/*.css` 为唯一运行时来源。

## 5. 项目组件与页面布局约束

当前共享适配层仅保留必要的薄封装：`DrpDataTable`、`DrpSidebarNav`、`DrpBreadcrumb`。适配层复用 Nuxt UI，不复制基础组件实现。组件状态以 `showcase/component-matrix.ts` 和 `docs/fusion/F1/F1-CONFLICT-MATRIX.csv` 为跟踪入口，不能推断为生产组件全量覆盖。

生产入口为 `src/main.ts` + `src/App.vue`，已接入 `src/app/router/index.ts`、动态路由页面、AppShell/Header/Breadcrumb 和完整 Sidebar 导航。业务页面当前使用本地展示数据；API、权限和异常契约仍保持迁移清单中的待接入边界，不在本次设计融合中虚构。Showcase 使用独立 Vite 配置、memory router 和本地 fixtures。

## 6. Typography、Density、Token 覆盖

- Typography 采用 SaaS 九级语义作为通用目标，GPUStack 按已批准的 ADR-D07 映射到 `--gp-*`；源资产见 `design-system/tokens/typography.json`，运行时映射由 `src/theme/typography.manager.ts` 在首屏初始化。
- Density 采用与 Theme 解耦的三密度目标（ADR-D08，`APPROVED`）；源资产见 `design-system/tokens/density.json`，运行时由 `src/theme/density.manager.ts` 管理并持久化。
- 运行时 CSS 统一使用 `--gp-*` 变量（ADR-D09，`APPROVED`）。五份主题 CSS 是 GPUStack 当前运行时原始色值来源；SaaS JSON 不直接进入生产运行时。
- 当前几何/Alpha Token 见 `src/theme/styles/tokens.css`；项目覆盖不得复制通用 HEX/字号/间距数值。

## 7. 禁止覆盖的规范

以下通用规则不得被项目覆盖：不得硬编码业务主题 HEX；不得以 hover 替代 focus-visible；Readonly 不得混用 Disabled；不得只靠颜色表达数据；必须保留键盘、焦点、表单关联、错误和状态播报；未经实际测试不得声称构建或 Playwright 通过。axe-core、Firefox/WebKit、截图和人工 WCAG 评审为项目永久豁免项，不执行也不宣称通过。

## 8. Showcase 与验证

Showcase 保留现有入口和本地 fixture（ADR-D10，`APPROVED`），继续扩展 `component-matrix.ts`、稳定 `data-testid`、主题持久化、组件状态、宽窄视口和真实 Nuxt UI 验收。Showcase 不得被加入生产入口、生产路由或生产包。

## 9. ADR 与变更流程

F1 冲突矩阵的每项记录必须有编号、影响范围、依据、建议方案和最终决策状态。当前 ADR 决策均已 `APPROVED`，实现完成度仍单独跟踪：

- 十项优先设计决策：ADR-D01 至 ADR-D10；
- 逐项冲突记录：ADR-CF-001 至 ADR-CF-020；
- 统一索引：`docs/fusion/F1/adr/ADR-INDEX.md`。

批准记录已由小张于 2026-11-01 同步。任何实现必须引用批准后的 ADR；尚未完成的实现和质量门禁不得被标记为已完成或 PASS。

## 10. 验收与变更流程

变更提交必须附：受影响 Token、组件状态、测试命令和退出码、截图或明确未执行项、兼容性风险和回滚方式。当前验收入口包括 `pnpm typecheck`、`pnpm build`、`pnpm build:showcase`、`pnpm test:showcase`、结构检查和生产隔离检查；这些命令的历史结果不能替代本次变更后的新证据。
