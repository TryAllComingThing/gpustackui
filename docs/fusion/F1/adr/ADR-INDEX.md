# F1 ADR 索引：SaaS 通用规范 + GPUStack 项目覆盖

F3 视觉扩展 ADR 见 `docs/fusion/F3/F3-ADR-DECISIONS.md`。其批准范围仅覆盖兼容 Token 与延期策略，不覆盖新的视觉数值。

状态约定：本文记录的 F1 决策已由小张（设计、产品、架构、无障碍责任人）于 2026-11-01 批准。每条记录对应 `docs/fusion/F1/F1-CONFLICT-MATRIX.csv` 的实际来源路径与证据。

## 批准记录

- 批准人：小张
- 责任角色：设计、产品、架构、无障碍
- 批准日期：2026-11-01
- 批准范围：ADR-D01 至 ADR-D10，以及 ADR-CF-001 至 ADR-CF-020 中记录的决策分类、项目覆盖和延期策略。
- 限制：批准设计决策不等同于所有实现、生产路由、axe、跨浏览器或人工无障碍验收已完成；这些状态继续由 F1 验收矩阵记录。

## ADR-D01：规范权威层级

- 状态：`APPROVED`
- 决策：采用 SaaS 通用规范 + GPUStack 项目覆盖两级结构。
- 通用规范：`DESIGN.md` 及其 Token/矩阵资产。
- 项目覆盖：根目录 `DESIGN.md` 仅记录 GPUStack 差异，不复制通用 HEX、字号和间距。
- 影响范围：所有 Token、布局、组件、Showcase 和后续 ADR。
- 验证方式：审计每项覆盖是否有来源、目标、状态和证据；批准记录见本文“批准记录”段；实现完成度仍由 F1 验收矩阵单独跟踪。

## ADR-D02：主题 ID

- 状态：`APPROVED`
- 决策：保留 `standard/business/future`，并采用 `sky`、`ocean` 作为 SaaS B/C 的 GPUStack runtime ID；SaaS A2/B/C/D/E 仍通过显式设计 ID 映射，不直接替换 GPUStack ID。
- 依据：`src/theme/theme.types.ts:1`、`src/theme/theme.registry.ts:2-6`、`DESIGN.md:22,32`。
- 映射：A2↔business、B↔sky、C↔ocean、D↔future、E↔standard；映射依据为五份实际主题源文件和 `src/theme/theme.registry.ts`。
- 影响范围：主题管理、localStorage、data-theme、所有组件和 Showcase。
- 验证方式：五主题切换、刷新恢复、Token 计算值和生产构建。

## ADR-D03：新主题 ID

- 状态：`APPROVED`
- 决策：新增 ID 为 `sky`、`ocean`，分别承接 SaaS B/C；实现已按批准决策加入 `THEME_IDS`、registry 和生产 CSS。批准记录已同步至本文“批准记录”段。
- 依据：SaaS `design-system/tokens/themes/B.json`、`C.json`；当前 GPU 的五个 ID 定义于 `src/theme/theme.types.ts:1`。
- 影响范围：主题注册、Token 编译、设计签审、视觉测试。
- 验证方式：五主题 CSS 与 JSON 键值 parity、切换持久化、视觉和对比度验证；不得新增未登记主题。

## ADR-D04：Header 高度

- 状态：`APPROVED`
- 决策：保留 60px。
- 通用规范：`design-system/contracts/LAYOUT_MATRIX.csv:8`。
- 项目依据：`DESIGN.md:36`、`src/theme/styles/tokens.css:13`。
- 影响范围：Header、内容区域、移动端抽屉定位、Breadcrumb。
- 验证方式：桌面/窄屏布局、截图和键盘交互测试。

## ADR-D05：Sidebar 宽度

- 状态：`APPROVED`
- 决策：保留展开 200px、折叠 64px。
- 通用规范：SaaS `DESIGN.md:37-41` 和 `contracts/LAYOUT_MATRIX.csv:9-10` 为 232/64。
- 项目依据：`DESIGN.md:37`、`src/theme/styles/tokens.css:13`。
- 优先级：GPUStack 项目覆盖 SaaS 默认值。
- 影响范围：Sidebar、菜单行、主内容宽度、响应式断点。
- 验证方式：展开/折叠、嵌套菜单、1440/1024/390 视口。

## ADR-D06：Breadcrumb 位置

- 状态：`APPROVED`
- 决策：Breadcrumb 保留在 Header 内，工作区不重复渲染。
- 通用规范：`DESIGN.md:37-41,51-59`。
- 项目依据：`DESIGN.md:38`。
- 当前差距：`src/components/common/AppBreadcrumb.vue` 与 `src/components/layout/AppShell.vue` 已接入当前骨架，但生产路由元数据、完整导航行为和验证证据尚未完成；Showcase 当前位于独立验收页面。
- 影响范围：AppShell、路由元数据、Header 溢出、键盘和读屏。
- 验证方式：唯一 Breadcrumb、`aria-current=page`、窄屏截断和焦点恢复。

## ADR-D07：Typography

- 状态：`APPROVED`
- 决策：采用 SaaS 九级语义作为通用目标，GPUStack 可在项目覆盖层明确映射到 `--gp-*` 字号；不复制数值，数值以通用 Token 资产为源。
- 通用规范：`DESIGN.md:25-29`。
- 项目依据：`src/theme/styles/tokens.css:4-7`、`src/theme/styles/typography.css:20-28`、`DESIGN.md:49`。
- 当前差距：候选 `design-system/tokens/typography.json` 已建立，契约校验已通过；`--gp-*` runtime 映射仍是实现工作，ADR-D07 已批准。
- 影响范围：字体层级、表单错误、表格、导航、可读性。
- 验证方式：字号/行高审计、五主题视觉验证、WCAG 对比度和缩放。

## ADR-D08：Density

- 状态：`APPROVED`
- 决策：Theme 与 Density 独立，目标为 Compact/Standard/Comfortable；当前不直接改变 GPU runtime。
- 通用规范：`DESIGN.md:15,31-41`、`design-system/contracts/LAYOUT_MATRIX.csv:1-11`。
- 项目依据：`src/theme/styles/tokens.css:6-16` 当前为固定几何 Token，无 density manager。
- 当前差距：候选 `design-system/tokens/density.json` 已建立，density manager 和状态保持测试仍是实现工作，ADR-D08 已批准。
- 影响范围：控件高度、表格行、卡片 padding、表单和滚动位置。
- 验证方式：密度切换不丢输入/筛选/滚动，五主题和三视口回归。

## ADR-D09：CSS Token

- 状态：`APPROVED`
- 决策：GPUStack 运行时统一使用 `--gp-*` 变量；SaaS JSON 通过未来编译/映射进入运行时，不直接 import。
- 通用规范：`DESIGN.md:17-23`、`tokens/SEMANTIC_MAPPING.json:2-16`、`tokens/COMPONENT_MAPPING.json:1-9`。
- 项目依据：`DESIGN.md:18,51-52`、`src/theme/styles/main.css:1-9`、五主题 CSS。
- 当前差距：组件 CSS 仍存在少量直接 `#FFFFFF` 常量，语义引用审计尚未完成。
- 影响范围：主题编译、组件适配、Showcase、生产隔离。
- 验证方式：Token 引用扫描、五主题计算值、生产包不包含 Showcase。

## ADR-D10：Showcase

- 状态：`APPROVED`
- 决策：保留现有独立 Showcase，后续扩展状态矩阵；不进入生产路由或生产包。
- 通用规范：`DESIGN.md:51-59,73-75` 和 `design-system/qa/ACCEPTANCE_CHECKLIST.csv:10-13`。
- 项目依据：`showcase/main.ts:1-13`、`showcase/vite.config.ts:1-7`、`showcase/component-matrix.ts:1-17`、`package.json:10-20`。
- 影响范围：本地 fixtures、Playwright、组件状态和视觉回归。
- 验证方式：独立构建、Showcase 测试、生产隔离扫描。

## ADR-CF-001：五主题与三主题

- 状态：`APPROVED`
- 分类：`CONFLICT`
- 影响范围：Theme ID、Token source、运行时切换。
- 建议方案：采用 ADR-D02；A2/B/C/D/E 显式映射为 business/sky/ocean/future/standard。
- 最终决策状态：`APPROVED`，设计、产品、架构、无障碍责任人已批准。

## ADR-CF-002/003/004：A2/D/E 映射

- 状态：`APPROVED`
- 分类：`SAME`
- 影响范围：品牌主色、页面背景、主题 registry。
- 建议方案：记录 A2↔business、D↔future、E↔standard，不改现有 GPU ID。
- 最终决策状态：`APPROVED`，实际值比对证据已记录，批准范围为映射决策。

## ADR-CF-005：B/C 主题

- 状态：`APPROVED`
- 分类：`MISSING`
- 影响范围：新增主题、设计签审、Token 编译。
- 建议方案：B/C 已映射为 sky/ocean 并实现；保留本冲突记录，批准状态已同步；实现和验证证据继续由 F1 验收矩阵跟踪。
- 最终决策状态：`APPROVED`。

## ADR-CF-006/012：Density 独立性与存储

- 状态：`APPROVED`
- 分类：`MISSING/EXTEND`
- 影响范围：几何 Token、密度切换、状态恢复。
- 建议方案：ADR-D08；先建立 density 资产和 manager 设计，再决定 runtime 接入。
- 最终决策状态：`APPROVED`。

## ADR-CF-007：Typography JSON 与 CSS

- 状态：`APPROVED`
- 分类：`EXTEND`
- 影响范围：字号 Token、CSS 编译、组件层级。
- 建议方案：以 SaaS 九级语义为通用目标，映射现有 `--gp-font-*`，补充独立资产前不改生产 CSS。
- 最终决策状态：`APPROVED`。

## ADR-CF-008：Header 高度

- 状态：`APPROVED`
- 分类：`SAME`
- 影响范围：Header、Breadcrumb、响应式。
- 建议方案：ADR-D04 60px。
- 最终决策状态：`APPROVED`。

## ADR-CF-009：Sidebar 宽度

- 状态：`APPROVED`
- 分类：`CONFLICT/OVERRIDE`
- 影响范围：Sidebar、内容区、折叠和移动端。
- 建议方案：ADR-D05 200/64，GPUStack 覆盖 SaaS 232/64。
- 最终决策状态：`APPROVED`。

## ADR-CF-010：Spacing 网格

- 状态：`APPROVED`
- 分类：`EXTEND`
- 影响范围：布局、卡片、表格和表单间距。
- 建议方案：保留 GPU 当前 Token，40/48 作为通用候选，不未经审批加入 runtime。
- 最终决策状态：`APPROVED`。

## ADR-CF-011：Radius 模型

- 状态：`APPROVED`
- 分类：`CONFLICT`
- 影响范围：所有主题的几何一致性。
- 建议方案：当前 GPU 几何与主题解耦；SaaS 主题半径作为后续候选，不改变本次已批准的 GPU 几何覆盖。
- 最终决策状态：`APPROVED`。

## ADR-CF-013：Semantic 命名空间

- 状态：`APPROVED`
- 分类：`OVERRIDE`
- 影响范围：Token 编译、组件 CSS、业务引用。
- 建议方案：保留 `--gp-*` runtime，增加可追溯映射，不做隐式别名合并。
- 最终决策状态：`APPROVED`。

## ADR-CF-014/015：组件覆盖与薄适配层

- 状态：`APPROVED`
- 分类：`EXTEND/SAME`
- 影响范围：组件矩阵、Drp 适配和 Showcase。
- 建议方案：复用真实 Nuxt UI，仅保留必要 Drp 薄适配；7 类已覆盖不等同 SaaS 23 类完成。
- 最终决策状态：`APPROVED`。

## ADR-CF-016：Breadcrumb 位置

- 状态：`APPROVED`
- 分类：`SAME/MISSING`
- 影响范围：AppShell、Header、路由元数据和 A11y。
- 建议方案：ADR-D06；最小 Shell 已建立，生产路由集成和完整验证前不标记完成。
- 最终决策状态：`APPROVED`。

## ADR-CF-017：主题源权威

- 状态：`APPROVED`
- 分类：`OVERRIDE`
- 影响范围：SaaS JSON 与 GPU CSS 的运行时关系。
- 建议方案：SaaS 作为通用输入，GPU CSS 作为当前运行时权威，未来通过编译器映射。
- 最终决策状态：`APPROVED`。

## ADR-CF-018：30% Alpha 值

- 状态：`APPROVED`
- 分类：`CONFLICT`
- 影响范围：Overlay、Modal、遮罩和视觉对比度。
- 建议方案：保留两套原始规范备份，提交设计评审确认 canonical value 后再改 Token。
- 最终决策状态：`APPROVED`。

## ADR-CF-019：A11y 与浏览器门禁

- 状态：`APPROVED`
- 分类：`DEFER`
- 影响范围：axe、Firefox、WebKit、截图、签审。
- 建议方案：保留为后续质量阶段，必须产生真实日志后更新状态。
- 最终决策状态：`APPROVED`。

## ADR-CF-020：生产 Shell

- 状态：`APPROVED`
- 分类：`MISSING/EXTEND`
- 影响范围：生产路由、AppShell、Header、Sidebar、Breadcrumb 和业务页面。
- 建议方案：最小 AppShell/Header/Breadcrumb 已接入骨架；仍需完成生产路由/API/页面存量盘点和真实导航，不得用 Showcase 代替生产实现。
- 最终决策状态：`APPROVED`。
