# Vue 3 SaaS Frontend Design System

状态：**FRAMEWORK-CONSOLIDATION / REVIEW**

本文件是仓库唯一的设计规范入口。它融合 SaaS Design System V1.1-M0 与当前 Vue 3 工程已经验证的视觉基础；旧版双层文件已原样归档到 `docs/fusion/archive/`。本次只冻结文档、契约和映射，不改变 Vue、CSS、Theme Engine、Showcase、依赖、业务 API 或权限实现。

## 1. 适用范围与权威顺序

本工程是通用 Vue 3 + TypeScript + Vite + Nuxt UI SaaS 前端框架。规范适用于生产壳、共享组件、主题运行时、密度、表单、表格、导航、图表和独立 Showcase。

权威顺序：

1. 安全、键盘和语义无障碍约束；
2. 本文件引用的 SaaS Token、组件和布局契约；
3. 已批准的框架默认布局和运行时兼容约束；
4. Nuxt UI 默认值和页面局部样式。

所有来源、目标路径、处理关系和状态见 `docs/fusion/FRAMEWORK/SOURCE-INVENTORY.csv`、`FUSION-MATRIX.csv`、`TOKEN-SOURCE-MAP.csv` 和 `COMPONENT-SOURCE-MAP.csv`。

视觉扩展批准流程见 `docs/fusion/FRAMEWORK/VISUAL-EXTENSION-APPROVAL.md`；扩展登记见 `VISUAL-EXTENSION-REGISTER.csv`。生产 Modal/Drawer 登记见 `PRODUCTION-OVERLAY-REGISTER.csv`。

未审批的冲突必须标记 `PROPOSED`、`PENDING` 或 `DEFERRED`，不得当作冻结值。任何命令没有实际退出码时不得宣称通过。

## 2. 主题与 Token

主题 Token 唯一工程来源为 `src/theme/tokens/`，包含合并后的五主题、Schema、Typography、Density、Semantic/Component mapping 和 SaaS visual foundation。SaaS 与旧 design-system 目录为迁移前来源，移除后不影响生成和运行时。`scripts/generate_theme_css.py` 生成运行时 CSS，运行时只消费 `--gp-*` 变量。业务组件不得硬编码主题 HEX，不得引入平行 `--ds-*` 运行时变量。

框架默认公开主题 ID 保留 `standard`、`business`、`future`。当前源码还包含 `sky`、`ocean` 兼容扩展；它们是已存在的运行时资产，不改变默认三主题契约。新增、删除或重命名主题必须形成 ADR，状态为 `PROPOSED` 之前不得实施。

主题与 Density、Appearance、Locale、Motion 独立存储。主题切换不得改变表单值、滚动位置、权限、业务逻辑或组件 API。

Token 层级：

- Primitive：`src/theme/tokens/themes/*.json`、`src/theme/tokens/typography.json`、`src/theme/tokens/density.json`；
- Semantic：`src/theme/styles/themes/*.css` 和 `src/theme/styles/tokens.css` 中的 `--gp-*`；
- Component：`src/theme/styles/components.css`、共享 Drp 适配和 Nuxt UI 变量；
- Compatibility：旧变量别名只能指向 `--gp-*`，不得复制第二套值。

## 3. Typography、Spacing 与 Density

Typography 使用九级语义：`display`、`page-title`、`section-title`、`card-title`、`body`、`body-small`、`caption`、`numeric`、`code`。数值来源为 `src/theme/tokens/typography.json`，runtime 映射由 `src/theme/typography.manager.ts` 完成。数字使用 tabular figures，代码使用等宽字体。

Spacing 基于 4px 网格。Density 使用 `compact`、`standard`、`comfortable`，由 `data-density` 驱动并与 `data-theme` 正交。Density Token 来源为 `src/theme/tokens/density.json`，runtime 入口为 `src/theme/density.manager.ts`。密度改变控件高度、表格行、卡片内边距、字段间距、区块间距、筛选间距和内容内边距，不改变 Header 或 Sidebar 项目默认几何。

## 4. Layout 与受控配置

框架默认布局参数：

| 参数 | 默认值 | 状态 | 约束 |
|---|---:|---|---|
| Header 高度 | 60px | APPROVED | 可配置，但应用必须显式声明覆盖来源 |
| Sidebar 展开 | 200px | APPROVED | 可配置；GPUStack 既有默认值 |
| Sidebar 折叠 | 64px | APPROVED | 可配置；必须保留键盘和选中态 |
| Breadcrumb | Header 内 | APPROVED | 工作区不得重复渲染 |
| Content padding | 由 Density 控制 | APPROVED | 只能引用 Density Token |

布局覆盖必须通过受控配置契约记录，例如 `layoutConfig.headerHeight`、`sidebarExpandedWidth`、`sidebarCollapsedWidth` 和 `breadcrumbPlacement`，并在源码映射中列出 owner、默认值、允许范围和回滚方式。不得在页面 CSS 中直接覆盖默认布局变量。未经批准的断点、Z-index、Sidebar 宽度和 Header 高度为 `PROPOSED`。

## 5. Surface、Radius、Border、Shadow、Motion 与 Icon

Surface 语义为 `canvas`、`default`、`subtle`、`raised`、`overlay`，当前通过 `--gp-surface-*` 从已批准主题层派生。SaaS 通用视觉基础位于 `src/theme/tokens/visual-foundation.json`，明确不映射到 GPU `--gp-*` runtime。GPU 仍保留现有兼容几何和阴影变量。

Motion 使用现有 Sidebar transition 和 `prefers-reduced-motion` 规则；新的时长分级必须先审批。Icon 保留现有 Nuxt UI/Lucide 使用和已登记尺寸别名；Icon family、线宽和语义集合扩展为 `PROPOSED`。

## 6. Components 与交互

组件契约见 `design-system/contracts/COMPONENT_MATRIX.csv` 和 `docs/design/COMPONENT-MATRIX.md`。状态按适用性覆盖 default、hover、pressed、focus-visible、selected、disabled、readonly、loading、error、success、empty。

Form 必须有 label/help/error 关联和状态播报；Table 必须支持排序、分页、选择、空、加载、错误和溢出；Navigation 必须支持选中、展开、嵌套、键盘和焦点；Modal/Drawer/Popover 必须处理 Escape、焦点恢复和外部交互。跨页面能力只允许薄 Drp 适配，不复制 Nuxt UI 原语。

## 7. Data Visualization

现有 `--gp-chart-1` 至 `--gp-chart-5` 继续兼容。Categorical、Sequential、Diverging、Semantic、Neutral 等完整图表色板没有批准的具体源值，保持 `PROPOSED`，不得自行生成。图表不得只依赖颜色，必须提供标签、线型、符号或数据表替代。

## 8. Accessibility 与质量范围

框架必须保留语义 landmark、可访问名称、键盘焦点、表单关联、错误播报、状态播报和 `aria-current`。项目永久豁免 axe-core、Firefox/WebKit、截图基线审批和人工 WCAG 评审；这些项目记录为 `EXEMPT`，不执行也不宣称通过。其余自动化测试必须记录命令、退出码、环境和报告路径。

## 9. Showcase

Showcase 是独立 Vite 入口和本地 fixtures，只用于开发验收，不进入生产路由或生产包。它必须展示真实 Nuxt UI/Drp 组件、Token、主题持久化、Density、状态矩阵和稳定 `data-testid`。Showcase 通过不能替代生产业务契约通过。

## 10. 工程治理

`AGENTS.md`、本文件、`docs/architecture/ARCHITECTURE.md`、`docs/quality/QUALITY-GATES.md` 和 `docs/fusion/FRAMEWORK/*` 构成文档治理入口。变更必须附来源、目标、状态、影响 Token、组件状态、兼容性风险、回滚方式和真实验证命令。

本次融合状态为 **REVIEW**：文档和契约已建立，所有未审批冲突仍显式标记，不能宣称 F1-PASS 或其他阶段 PASS。
