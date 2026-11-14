# Vue Frontend Design System

本文件是仓库唯一活动设计规范。它适用于生产应用壳、共享组件、主题运行时、密度、表单、表格、导航、图表和独立 Showcase。

## 1. 适用范围与权威顺序

本工程是通用 Vue 3 + TypeScript + Vite + Nuxt UI SaaS 前端框架。

权威顺序：

1. 安全、键盘和语义无障碍约束；
2. 本文件定义的 Token、组件和布局契约；
3. 框架默认布局和运行时兼容约束；
4. Nuxt UI 默认值和页面局部样式。

活动来源与目标路径见 `src/theme/tokens/`、`src/theme/styles/`、`docs/design/TOKEN-MAPPING.md` 和 `docs/design/COMPONENT-MATRIX.md`。

视觉扩展先写入 ADR，再修改 Token 源。生产 Modal/Drawer 直接使用 Nuxt UI 原语。

## 2. 主题与 Token

主题 Token 唯一工程来源为 `src/theme/tokens/`，包含五主题、Appearance、Schema、Typography、Density、Semantic/Component mapping 和 visual foundation。`scripts/generate_theme_css.py` 生成运行时 CSS，运行时只消费 `--gp-*` 变量。业务组件不得硬编码主题 HEX，不得引入平行 `--ds-*` 运行时变量。

公开一等主题 ID 为 `standard`、`business`、`future`、`sky`、`ocean`。五套主题在运行时选择器、registry、生成 CSS 与持久化契约中一视同仁。新增、删除或重命名主题必须形成 ADR。

主题与 Density、Appearance、Locale、Motion 独立存储。Appearance 只提供 `system`、`light`、`dark` 三种外观偏好；运行时解析为 `light` 或 `dark`，写入 `data-appearance`、`data-appearance-preference`、`color-scheme` 和兼容 Nuxt UI `dark:` 变体的 `dark` class，不改变主题 ID。主题或外观切换不得改变表单值、滚动位置、权限、业务逻辑或组件 API。

Token 层级：

- Primitive：`src/theme/tokens/themes/*.json`、`src/theme/tokens/appearance.json`、`src/theme/tokens/typography.json`、`src/theme/tokens/density.json`；
- Semantic：`src/theme/styles/themes/*.css`、`src/theme/styles/themes/appearance.css` 和 `src/theme/styles/tokens.css` 中的 `--gp-*`；
- Component：`src/theme/styles/components.css`、共享 U 适配和 Nuxt UI 变量；
- Compatibility：旧变量别名只能指向 `--gp-*`，不得复制第二套值。

## 3. Typography、Spacing 与 Density

Typography 使用九级语义：`display`、`page-title`、`section-title`、`card-title`、`body`、`body-small`、`caption`、`numeric`、`code`。数值来源为 `src/theme/tokens/typography.json`，runtime 映射由 `src/theme/typography.manager.ts` 完成。数字使用 tabular figures，代码使用等宽字体。

Spacing 基于 4px 网格。Density 使用 `compact`、`standard`、`comfortable`，由 `data-density` 驱动并与 `data-theme` 正交。Density Token 来源为 `src/theme/tokens/density.json`，runtime 入口为 `src/theme/density.manager.ts`。密度改变控件高度、表格行、卡片内边距、字段间距、区块间距、筛选间距和内容内边距，不改变 Header 或 Sidebar 项目默认几何。

## 4. Layout 与受控配置

框架默认布局参数：

| 参数 | 默认值 | 约束 |
|---|---:|---|
| Header 高度 | 60px | 可配置；应用必须显式声明覆盖来源 |
| Sidebar 展开 | 200px | 可配置；默认导航宽度 |
| Sidebar 折叠 | 64px | 可配置；必须保留键盘和选中态 |
| Breadcrumb | Header 内 | 工作区不得重复渲染 |
| Content padding | 由 Density 控制 | 只能引用 Density Token |

布局覆盖必须通过受控配置契约记录，例如 `layoutConfig.headerHeight`、`sidebarExpandedWidth`、`sidebarCollapsedWidth` 和 `breadcrumbPlacement`，并在源码映射中列出 owner、默认值、允许范围和变更影响。不得在页面 CSS 中直接覆盖默认布局变量。新的断点、Z-index、Sidebar 宽度和 Header 高度先进入 ADR。

## 5. Surface、Radius、Border、Shadow、Motion 与 Icon

Surface 语义为 `canvas`、`default`、`subtle`、`raised`、`overlay`，通过 `--gp-surface-*` 从主题层派生；深色外观只覆盖语义底色、文字、边框和 Shell 表面，不形成第二套主题。通用视觉基础位于 `src/theme/tokens/visual-foundation.json`，不直接映射到 `--gp-*` runtime。保留现有兼容几何和阴影变量。

Motion 使用现有 Sidebar transition 和 `prefers-reduced-motion` 规则；新的时长分级先进入 ADR。Icon 使用 Nuxt UI/Lucide 和已登记尺寸别名；Icon family、线宽和语义集合扩展先进入 ADR。

## 6. Components 与交互

组件契约见 `docs/design/COMPONENT-MATRIX.md`。状态按适用性覆盖 default、hover、pressed、focus-visible、selected、disabled、readonly、loading、error、success、empty。

Form 必须有 label/help/error 关联和状态播报；Table 必须支持排序、分页、选择、空、加载、错误和溢出；Navigation 必须支持选中、展开、嵌套、键盘和焦点；Modal/Drawer/Popover 必须处理 Escape、焦点恢复和外部交互。跨页面能力只允许薄 U 适配，不复制 Nuxt UI 原语。

## 7. Data Visualization

现有 `--gp-chart-1` 至 `--gp-chart-5` 继续兼容，并覆盖 Categorical、Sequential、Diverging、Semantic、Neutral 色板。图表不得只依赖颜色，必须提供标签、线型、符号或数据表替代。

## 8. Accessibility

框架必须保留语义 landmark、可访问名称、键盘焦点、表单关联、错误播报、状态播报和 `aria-current`。交互组件必须处理 Enter/Space、Escape、焦点陷阱和焦点恢复；异步区域使用合适的 live region 或 `aria-busy`。

自动化 axe、键盘和减少动效检查可使用仓库现有 Playwright 配置执行。测试范围按变更影响选择，不把未运行的检查描述为通过。

## 9. Showcase

Showcase 是独立 Vite 入口和本地 fixtures，只用于开发预览，不进入生产路由或生产包。它必须展示真实 Nuxt UI/U 组件、Token、主题持久化、Density、状态矩阵和稳定 `data-testid`。Showcase 与生产使用同一组件和 manager 实现。

## 10. 扩展与兼容

- 新组件先检查 Nuxt UI 是否已覆盖；仅跨页面状态、无障碍、递归或稳定 DOM 契约需要 `U*` 适配器。
- 新 Token 先进入源 JSON 或映射表，再生成 CSS；禁止在页面直接补颜色。
- 兼容 alias 保持单向指向 canonical `--gp-*`；新代码只使用 canonical 名称。
- 主题 ID 属于持久化契约，删除或重命名必须提供迁移策略。
- 破坏性公共 API 变更通过 ADR 记录影响、替代方案和迁移方式。

## 11. 框架全景

- 架构：Vite 入口初始化 Theme/Density/Appearance/Typography/Layout/Locale；`UApp` 提供 Nuxt UI Provider；`AppShell` 组织 Header/`UBreadcrumb`/`USidebarNav`/Main；页面按 `src/modules` 组织；Showcase 独立入口但复用 `src/`。
- 设计思路：直接复用 Nuxt UI 4，跨页面状态使用薄 `U*` adapter；业务只消费 `--gp-*`；Token 按 Primitive → Semantic → Component → Compatibility 单向流动。
- 设计理念：一致性、可访问性、正交性、兼容性、最小适配和生产/Showcase 同源。
