# Vue 3 SaaS Framework Token Mapping

唯一机器可读 Token 源为 `src/theme/tokens/`。生产与 Showcase 都从 `src/theme/index.css` 进入，只消费 `--gp-*`；不得出现平行 `--ds-*` 运行时命名空间。

## 1. Token 管线

- Primitive theme values：`src/theme/tokens/themes/*.json` → `scripts/generate_theme_css.py` → `src/theme/styles/themes/*.css`；
- Appearance：`src/theme/tokens/appearance.json` → `scripts/generate_theme_css.py` → `src/theme/styles/themes/appearance.css`；运行时只写 `data-appearance` 与兼容 `dark` class；
- Typography：`src/theme/tokens/typography.json` → `src/theme/typography.manager.ts` → `--gp-type-*`；
- Density：`src/theme/tokens/density.json` → `src/theme/density.manager.ts` → `data-density` selector 与几何变量；
- Surface、text、border、radius、shadow、motion、icon alias：`src/theme/styles/tokens.css`；
- Component/layout semantics：`src/theme/styles/components.css`、`src/theme/styles/layout.css`；
- Nuxt UI bridge：`src/theme/styles/nuxt-ui.bridge.css` 将 `--gp-*` 映射到 Nuxt UI `--ui-*`；
- Visual foundation 参考源：`src/theme/tokens/visual-foundation.json`，用于对齐通用视觉基础，不自动改写 GPU 运行时。

兼容 alias 只能单向指向 canonical `--gp-*`。任何业务组件都不得新增主题 HEX、复制第二套值，或从 compatibility alias 反向定义 canonical token。

## 2. 兼容 API

| API | 类型 | 说明 |
|---|---|---|
| `--gp-font-xs/sm/md/lg/title/kpi` | COMPAT | 旧 Typography alias，均单向指向 `--gp-type-*`。 |
| `--gp-font-xl` | COMPAT | 历史 alias；当前映射到 `--gp-type-section-title-size`（20px）。 |
| `--gp-layout-header-height`、`--gp-layout-sidebar-width`、`--gp-layout-sidebar-collapsed-width` | COMPAT | 受控布局 alias；指向 `--gp-header-height`、`--gp-sidebar-width`、`--gp-sidebar-collapsed-width`。 |
| `--gp-motion-standard/layout/none`、`--gp-sidebar-transition` | COMPAT | 动效 API；被布局过渡和 `prefers-reduced-motion` 使用。 |
| `--gp-icon-size-inline/sm/md`、`--gp-menu-icon-size`、`--gp-submenu-icon-size` | COMPAT | 图标尺寸 API；导航、按钮与内联图标消费。 |
| `--gp-chart-primary/secondary` | COMPAT | 图表 alias，分别指向 `--gp-chart-1`、`--gp-chart-2`。 |
| `--gp-surface-canvas/default/subtle/raised/overlay` | SEMANTIC | 由主题背景层派生；`raised` 使用 `background-n100`，`overlay` 使用 `surface-white` 并随 Appearance 解析。 |
| `--gp-background-*`、`--gp-text-*`、`--gp-line-*`、`--gp-header-*`、`--gp-sidebar-*` | SEMANTIC | 浅色值来自主题层；`data-appearance="dark"` 时由 `appearance.css` 覆盖为深色语义值，不新增主题 ID 或第二套命名空间。 |
| `--gp-radius-interactive/surface`、`--gp-shadow-surface/elevated/overlay` | COMPAT | 组件语义 alias，指向 canonical radius/shadow。 |
| `--gp-border-divider/subtle`、`--gp-text-tertiary/muted/disabled`、`--gp-primary-accent/light` | SEMANTIC | 从主题 primitive 派生，供组件消费。 |
| `--gp-primary-hover/pressed`、`--gp-primary-subtle`、`--gp-focus-ring`、`--gp-sidebar-active-bg`、`--gp-sidebar-sub-active-bg` | SEMANTIC | 交互与导航状态契约。`hover` 使用 `brand.hover`/`--gp-brand-g500`，`pressed` 使用 `brand.pressed`/`--gp-brand-g900`。 |
| `--gp-z-header/sidebar/popover` | COMPAT | 当前兼容层级 fallback；新的 z-index 设计契约先进入 ADR。 |
| `--gp-control-height` / `--gp-control-height-md`、`--gp-table-row-height` / `--gp-table-row-height-md`、`--gp-card-padding` / `--gp-card-padding-md` | COMPAT | 新旧几何 API 并行存在；值由 Density 驱动，新代码使用无后缀 canonical 名称。 |
| 无前缀 alias（`--header-bg`、`--sidebar-bg`、`--page-bg`、`--card-bg`、`--text-primary`、`--radius-control`、`--shadow-card` 等） | COMPAT | V2.0 无前缀 alias；每一项单向指向 `--gp-*`。 |

## 3. Typography、几何与动效

| API | 当前值 | 说明 |
|---|---|---|
| `--gp-font-xs` | `var(--gp-type-caption-size)` | 12px 最小文字层。 |
| `--gp-font-sm` | `var(--gp-type-body-small-size)` | 13px。 |
| `--gp-font-md` | `var(--gp-type-body-size)` | 14px 正文。 |
| `--gp-font-lg` | `var(--gp-type-card-title-size)` | 16px。 |
| `--gp-font-xl` | `var(--gp-type-section-title-size)` | 20px。 |
| `--gp-font-title` | `var(--gp-type-page-title-size)` | 24px。 |
| `--gp-font-kpi` | `var(--gp-type-display-size)` | 32px。 |
| `--gp-layout-header-height` | `var(--gp-header-height)` | 默认 60px。 |
| `--gp-layout-sidebar-width` | `var(--gp-sidebar-width)` | 默认 200px。 |
| `--gp-layout-sidebar-collapsed-width` | `var(--gp-sidebar-collapsed-width)` | 默认 64px。 |
| `--gp-motion-standard` | 160ms | 常规交互。 |
| `--gp-motion-layout` | `var(--gp-motion-standard)` | 布局过渡。 |
| `--gp-sidebar-transition` | 160ms | Sidebar 展开/折叠；`prefers-reduced-motion` 下为 0ms。 |
| `--gp-motion-none` | 0ms | 无过渡。 |
| `--gp-control-height` | Density 值 | 新代码使用无后缀名称。 |
| `--gp-table-row-height` | Density 值 | 表格行高。 |
| `--gp-card-padding` | Density 值 | 卡片内边距。 |

## 4. Radius、Shadow、Icon 与层级

| API | 当前值 | 说明 |
|---|---|---|
| `--gp-radius-none` | `0px` | 结构语义。 |
| `--gp-radius-tag` | `4px` | 与控件圆角统一。 |
| `--gp-radius-control` | `4px` | 输入框、按钮和紧凑表格。 |
| `--gp-radius-card` | `6px` | 卡片层级。 |
| `--gp-radius-dialog` | `8px` | Overlay 边界。 |
| `--gp-radius-full` | `9999px` | 胶囊/头像。 |
| `--gp-radius-interactive` | `var(--gp-radius-control)` | 交互圆角 alias。 |
| `--gp-radius-surface` | `var(--gp-radius-card)` | 表面圆角 alias。 |
| `--gp-shadow-card` | `0 1px 3px rgba(0, 0, 0, 0.08)` | elevation1。 |
| `--gp-shadow-popover` | `0 8px 24px rgba(0, 0, 0, 0.12)` | elevation2。 |
| `--gp-shadow-modal` | `0 16px 48px rgba(0, 0, 0, 0.18)` | elevation3。 |
| `--gp-icon-size-inline` | `var(--gp-icon-size-sm)` | 行内图标。 |
| `--gp-icon-size-sm` | `16px` | 小图标。 |
| `--gp-icon-size-md` | `20px` | 主导航图标。 |
| `--gp-menu-icon-size` | `var(--gp-icon-size-md)` | 菜单图标 alias。 |
| `--gp-submenu-icon-size` | `16px` | 子导航图标。 |
| `--gp-z-header` | `20` | 当前兼容值。 |
| `--gp-z-sidebar` | `30` | 当前兼容值。 |
| `--gp-z-popover` | `40` | 当前兼容值。 |

## 5. Surface、Border、Text 与交互色

| API | 当前值 | 说明 |
|---|---|---|
| `--gp-surface-canvas` | `var(--gp-page-bg)` | 页面背景层。 |
| `--gp-surface-default` | `var(--gp-card-bg)` | 默认表面。 |
| `--gp-surface-subtle` | `var(--gp-background-n100)` | 表头/次级区域。 |
| `--gp-surface-raised` | `var(--gp-background-n100)` | 高于默认表面的轻层级。 |
| `--gp-surface-overlay` | `var(--gp-surface-white)` | Modal/Drawer 最高纯净表面。 |
| `--gp-border-divider` | `var(--gp-line-n250)` | 结构分隔。 |
| `--gp-border-subtle` | `var(--gp-line-n200)` | 弱分隔。 |
| `--gp-text-tertiary` | `var(--gp-text-n600)` | 三级文字。 |
| `--gp-text-muted` | `var(--gp-text-n500)` | 弱提示。 |
| `--gp-text-disabled` | `var(--gp-text-n400)` | 禁用文字。 |
| `--gp-primary-accent` | `var(--gp-brand-g400)` | 品牌亮色。 |
| `--gp-primary-light` | `var(--gp-brand-g300)` | 浅品牌色。 |
| `--gp-primary-subtle` | `var(--gp-brand-g100)` | 弱强调背景。 |
| `--gp-primary-hover` | `var(--gp-brand-g500)` | hover 比 default 深、比 pressed 浅。 |
| `--gp-primary-pressed` | `var(--gp-brand-g900)` | 最深交互态。 |
| `--gp-focus-ring` | `var(--gp-brand-g600)` | 焦点环。 |
| `--gp-sidebar-active-bg` | `var(--gp-primary-subtle)` | 导航 active 背景。 |
| `--gp-sidebar-sub-active-bg` | `var(--gp-alpha-white-10)` | 子菜单 active 层。 |

五主题 primary/hover/pressed 源值：

| 主题 | Primary | Pressed | Hover |
|---|---|---|---|
| standard | `#0D61F2` | `#084BC2` | `#0C5EEB` |
| business | `#1554B4` | `#103F8C` | `#1451AE` |
| future | `#315CF5` | `#2546C7` | `#2F59EE` |
| sky | `#1469D8` | `#0A4EAC` | `#1265D1` |
| ocean | `#1769AA` | `#104B80` | `#1664A4` |

## 6. 兼容清理原则

1. 公开 API 不能仅凭内部零引用删除；先登记外部页面、持久化主题值和可能的第三方消费方。
2. 兼容 alias 不是第二套设计值，必须单向指向 canonical `--gp-*`。
3. 主题 ID 属于持久化契约；删除或重命名必须提供映射或迁移策略。
4. 新代码只用 canonical 名称；破坏性清理通过 ADR 记录影响和替代方案。

## 7. 修改流程

1. 确认变更属于哪个 Token 层（Primitive、Semantic、Component、Compatibility）。
2. 修改源 JSON 或映射表，不直接改生成 CSS。
3. 运行 `npm run generate:theme-css`。
4. 运行 `npm run check:theme-css` 和 `npm run check:tokens`。
5. 运行受影响的单元测试、Showcase 检查和构建。
6. 同步本文件、`THEME-CONTRACT.md` 和相关组件。
