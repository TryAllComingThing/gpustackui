# Vue 3 SaaS Framework Token Mapping

状态：`APPROVED` 管线 + `APPROVED` 兼容值。2026-11-03 人工批准全部推荐值，已落入主题源、生成 CSS 和运行时 alias。

唯一机器可读 Token 源为 `src/theme/tokens/`。生产与 Showcase 都从 `src/theme/index.css` 进入，只消费 `--gp-*`；不得出现平行 `--ds-*` 运行时命名空间。

## 1. Token 管线

- Primitive theme values：`src/theme/tokens/themes/*.json` → `scripts/generate_theme_css.py` → `src/theme/styles/themes/*.css`；
- Typography：`src/theme/tokens/typography.json` → `src/theme/typography.manager.ts` → `--gp-type-*`；
- Density：`src/theme/tokens/density.json` → `src/theme/density.manager.ts` → `data-density` selector 与几何变量；
- Surface、text、border、radius、shadow、motion、icon alias：`src/theme/styles/tokens.css`；
- Component/layout semantics：`src/theme/styles/components.css`、`src/theme/styles/layout.css`；
- Nuxt UI bridge：`src/theme/styles/nuxt-ui.bridge.css` 将 `--gp-*` 映射到 Nuxt UI `--ui-*`；
- Visual foundation 参考源：`src/theme/tokens/visual-foundation.json`，状态 `APPROVED`，用于对齐通用视觉基础，不自动改写 GPU 运行时。

兼容 alias 只能单向指向 canonical `--gp-*`。任何业务组件都不得新增主题 HEX、复制第二套值，或从 compatibility alias 反向定义 canonical token。

## 2. 状态约定

| 状态 | 含义 |
|---|---|
| `APPROVED` | 已有活动设计权威和实现证据。 |
| `COMPAT` | 已公开或已消费的兼容 API，保留但不得继续扩散。 |
| `PROPOSED` | 设计方向明确，但尚未完成审批。 |
| `PENDING HUMAN APPROVAL` | 本文给出最佳推荐值；人工批准前不得改运行时。 |
| `DEFERRED` | 明确不进入当前交付。 |
| `BLOCKED` | 缺少前置条件或关键证据。 |

## 3. 公开兼容 API 及保留原因

| API | 状态 | 保留原因 |
|---|---|---|
| `--gp-font-xs/sm/md/lg/title/kpi` | COMPAT | V2.x 已发布 typography alias，生产 UI、Showcase 或外部消费方可能直接引用；删除会在不改变设计意图的情况下造成 API 断裂。它们均单向指向 `--gp-type-*`。 |
| `--gp-font-xl` | COMPAT | V2.x 历史 alias。2026-11-03 已批准映射到 `--gp-type-section-title-size`（20px）；仍保留名称供旧消费方使用。 |
| `--gp-layout-header-height`、`--gp-layout-sidebar-width`、`--gp-layout-sidebar-collapsed-width` | COMPAT | 既有受控布局消费方使用这些名字；它们只是 `--gp-header-height`、`--gp-sidebar-width`、`--gp-sidebar-collapsed-width` 的 alias，不允许出现第二套值。 |
| `--gp-motion-standard/layout/none`、`--gp-sidebar-transition` | COMPAT | V2.x 动效 API；被布局过渡和 `prefers-reduced-motion` 使用。保留名字，但目标值应与 `visual-foundation.motion` 对齐。 |
| `--gp-icon-size-inline/sm/md`、`--gp-menu-icon-size`、`--gp-submenu-icon-size` | COMPAT | V2.x 图标尺寸 API；导航、按钮与内联图标已有消费。保留名字，值按已批准 icon size 对齐。 |
| `--gp-chart-primary/secondary` | COMPAT | V2.x 图表 alias，分别指向 `--gp-chart-1`、`--gp-chart-2`；完整 DataViz 色板仍为 `PROPOSED`。 |
| `--gp-surface-canvas/default/subtle/raised/overlay` | SEMANTIC | 由主题背景层派生；`raised` 已使用 `background-n100`，`overlay` 保持纯白，形成明确层级。 |
| `--gp-radius-interactive/surface`、`--gp-shadow-surface/elevated/overlay` | COMPAT | V2.x 组件语义 alias；保留名称并指向 canonical radius/shadow，避免业务组件直接依赖 legacy 名称。 |
| `--gp-border-divider/subtle`、`--gp-text-tertiary/muted/disabled`、`--gp-primary-accent/light` | SEMANTIC | 已发布的语义 alias；均从主题 primitive 派生，供组件消费。 |
| `--gp-primary-hover/pressed`、`--gp-primary-subtle`、`--gp-focus-ring`、`--gp-sidebar-active-bg`、`--gp-sidebar-sub-active-bg` | SEMANTIC | 交互与导航状态契约。`hover` 已使用新增 `brand.hover`/`--gp-brand-g500`，`pressed` 使用 `brand.pressed`/`--gp-brand-g900`。 |
| `--gp-z-header/sidebar/popover` | PROPOSED | V2 兼容层级仍在使用，但 z-index 设计契约尚未批准；不能把兼容 fallback 当成最终设计标准。 |
| `--gp-control-height` / `--gp-control-height-md`、`--gp-table-row-height` / `--gp-table-row-height-md`、`--gp-card-padding` / `--gp-card-padding-md` | COMPAT | 新旧几何 API 并行存在；值由 Density 驱动。保留 `-md` 是为了避免已消费方断裂，新代码应使用无后缀 canonical 名称。 |
| `--header-bg`、`--header-fg`、`--sidebar-bg`、`--sidebar-fg`、`--sidebar-item-hover-bg`、`--sidebar-item-active-bg`、`--sidebar-item-active-fg`、`--page-bg`、`--card-bg`、`--table-head-bg`、`--text-primary`、`--text-n800`、`--text-secondary`、`--border-default`、`--radius-control`、`--radius-card`、`--radius-dialog`、`--radius-tag`、`--shadow-card`、`--focus-ring`、`--white-alpha-10`、`--white-alpha-60` | COMPAT | V2.0 无前缀 alias。保留原因是既有消费者可能尚未完成 V2.4 迁移；每一项必须单向指向 `--gp-*`，不得成为新的 source of truth。 |
| 主题 ID `sky`、`ocean` | APPROVED | 已冻结为公开一等主题，与 `standard`、`business`、`future` 同权；主题 ID 属于持久化契约，删除或重命名必须走 ADR 和主版本迁移。 |

## 4. 兼容 API 已批准值

以下推荐值已于 2026-11-03 获人工批准并全部落地。表头保留“批准前值”用于追溯，当前运行时使用“已批准值”。

### 4.1 Typography、几何与动效

| API | 批准前值 | 已批准值（已落地） | 原因 |
|---|---|---|---|
| `--gp-font-xs` | `var(--gp-type-caption-size)` | 保持 `12px` | 与最小文字层一致，避免破坏 caption 的可读性边界。 |
| `--gp-font-sm` | `var(--gp-type-body-small-size)` | 保持 `13px` | 与 `body-small` 对齐。 |
| `--gp-font-md` | `var(--gp-type-body-size)` | 保持 `14px` | 与正文层对齐。 |
| `--gp-font-lg` | `var(--gp-type-card-title-size)` | 保持 `16px` | 与 card title 对齐。 |
| `--gp-font-xl` | `18px` | `var(--gp-type-section-title-size)`（`20px`） | 九级 Typography 中没有 18px 级别；映射到 `section-title` 可消除孤立数值，并保持层级语义。 |
| `--gp-font-title` | `var(--gp-type-page-title-size)` | 保持 `24px` | 与 page title 对齐。 |
| `--gp-font-kpi` | `var(--gp-type-display-size)` | 保持 `32px` | 与 display 对齐。 |
| `--gp-layout-header-height` | `var(--gp-header-height)` | 保持 `60px` | 受控布局默认值已批准。 |
| `--gp-layout-sidebar-width` | `var(--gp-sidebar-width)` | 保持 `200px` | 受控布局默认值已批准。 |
| `--gp-layout-sidebar-collapsed-width` | `var(--gp-sidebar-collapsed-width)` | 保持 `64px` | 保留可访问导航和选中态所需空间。 |
| `--gp-motion-standard` | `200ms` | `160ms` | 与 `visual-foundation.motion.standard` 对齐，减少常规交互等待。 |
| `--gp-motion-layout` | `200ms` | `160ms` | 与 standard 统一；布局过渡不再慢于普通组件反馈。 |
| `--gp-sidebar-transition` | `200ms` | `160ms` | Sidebar 展开/折叠应与 standard 动效一致；`prefers-reduced-motion` 仍为 `0ms`。 |
| `--gp-motion-none` | `0ms` | 保持 `0ms` | 减少动效时必须是真正的零过渡。 |
| `--gp-control-height` / `--gp-control-height-md` | Density 值 | 保持同值；新代码只用无后缀名称 | 保留两个名字兼容旧消费方，但禁止未来出现两套几何值。 |
| `--gp-table-row-height` / `--gp-table-row-height-md` | Density 值 | 保持同值；新代码只用无后缀名称 | 表格密度必须由同一份 Density 源驱动。 |
| `--gp-card-padding` / `--gp-card-padding-md` | Density 值 | 保持同值；新代码只用无后缀名称 | 避免卡片内边距出现平行定义。 |

### 4.2 Radius、Shadow、Icon 与层级

| API | 批准前值 | 已批准值（已落地） | 原因 |
|---|---|---|---|
| `--gp-radius-none` | `0px` | 保持 `0px` | 0 是结构语义，不应被主题或密度覆盖。 |
| `--gp-radius-tag` | `3px` | `4px` | 与控件圆角统一，减少同一界面内 3/4px 的细微漂移；tag 仍明显小于 card/dialog。 |
| `--gp-radius-control` | `4px` | 保持 `4px` | 输入框、按钮和紧凑表格最稳定的交互圆角。 |
| `--gp-radius-card` | `6px` | 保持 `6px` | 比控件略大，形成清晰但不夸张的层级。 |
| `--gp-radius-dialog` | `8px` | 保持 `8px` | Overlay 需要比 card 更强的边界感，同时避免与 card 差距过大。 |
| `--gp-radius-full` | `9999px` | 保持 `9999px` | 胶囊/头像的稳定全圆角。 |
| `--gp-radius-interactive` | `var(--gp-radius-control)` | 保持 `4px` | 只做 alias，避免交互圆角出现第二定义。 |
| `--gp-radius-surface` | `var(--gp-radius-card)` | 保持 `6px` | 只做 alias，保持表面层级一致。 |
| `--gp-shadow-card` | `0 1px 3px #0000000D` | `0 1px 3px rgba(0, 0, 0, 0.08)` | 与 `visual-foundation.shadow.elevation1` 对齐，并统一 alpha 写法。 |
| `--gp-shadow-popover` | `0 8px 24px #0000001A` | `0 8px 24px rgba(0, 0, 0, 0.12)` | 与 `elevation2` 对齐，浮层边界更稳定。 |
| `--gp-shadow-modal` | `0 16px 48px #00000030` | `0 16px 48px rgba(0, 0, 0, 0.18)` | 与 `elevation3` 对齐；当前透明度略重。 |
| `--gp-shadow-surface/elevated/overlay` | 指向 card/popover/modal shadow | 保持 alias | 只做语义映射，不复制影值。 |
| `--gp-icon-size-inline` | `var(--gp-icon-size-sm)` | 保持 `16px` | 内联图标与小型图标一致，避免文字行高抖动。 |
| `--gp-icon-size-sm` | `16px` | 保持 `16px` | 与 `visual-foundation.icon.sizes.sm` 对齐。 |
| `--gp-icon-size-md` | `18px` | `20px` | 与 `visual-foundation.icon.sizes.md` 对齐；18px 没有批准来源。 |
| `--gp-menu-icon-size` | `18px` | `20px` | 主导航图标应与 md 一致，保持视觉权重和点击目标稳定。 |
| `--gp-submenu-icon-size` | `16px` | 保持 `16px` | 子导航需要更轻的视觉层级。 |
| `--gp-z-header` | `20` | 保持 `20` | 与 `visual-foundation.layout.zIndex.header` 对齐；但整体 z-index 契约仍是 `PROPOSED`。 |
| `--gp-z-sidebar` | `30` | 保持 `30` | 与 `visual-foundation.layout.zIndex.sidebar` 对齐。 |
| `--gp-z-popover` | `40` | 保持 `40` | 与 `visual-foundation.layout.zIndex.popover` 对齐。 |

### 4.3 Surface、Border、Text 与交互色

| API | 批准前值 | 已批准值（已落地） | 原因 |
|---|---|---|---|
| `--gp-surface-canvas` | `var(--gp-page-bg)` | 保持 | canvas 必须始终等于页面背景层。 |
| `--gp-surface-default` | `var(--gp-card-bg)` | 保持 | 默认表面必须等于卡片表面层。 |
| `--gp-surface-subtle` | `var(--gp-background-n100)` | 保持 | 用于表头/次级区域，与主题 `background.subtle` 对齐。 |
| `--gp-surface-raised` | `var(--gp-surface-white)` | `var(--gp-background-n100)` | raised 应高于默认表面而不是与 overlay 同为纯白；使用主题 subtle 背景形成轻层次，无需新增色值。 |
| `--gp-surface-overlay` | `var(--gp-surface-white)` | 保持 `var(--gp-surface-white)` | Modal/Drawer 需要最高纯净表面，避免与页面层级混淆。 |
| `--gp-border-divider` | `var(--gp-line-n250)` | 保持 | divider 比 default border 更轻，符合结构分隔语义。 |
| `--gp-border-subtle` | `var(--gp-line-n200)` | 保持 | 最轻边框层用于弱分隔。 |
| `--gp-text-tertiary` | `var(--gp-text-n600)` | 保持 | 保持 primary/secondary/tertiary/muted/disabled 四级层次。 |
| `--gp-text-muted` | `var(--gp-text-n500)` | 保持 | muted 比 tertiary 更弱。 |
| `--gp-text-disabled` | `var(--gp-text-n400)` | 保持 | disabled 必须清晰可辨但不可与正文竞争。 |
| `--gp-primary-accent` | `var(--gp-brand-g400)` | 保持 | accent 是品牌亮色，不应被 hover 复用。 |
| `--gp-primary-light` | `var(--gp-brand-g300)` | 保持 | 浅品牌色用于弱强调背景。 |
| `--gp-primary-subtle` | `var(--gp-brand-g100)` | 保持 | 与 `navigation.active.background = brand.subtle` 对齐。 |
| `--gp-primary-hover` | `var(--gp-brand-g900)` | `var(--gp-brand-g500)` | hover 比 default 深、比 pressed 浅；五主题源已写入 85:15 派生 hover 值，语义映射改为 `brand.hover`。 |
| `--gp-primary-pressed` | `var(--gp-brand-g900)` | 保持 `var(--gp-brand-g900)` | pressed 必须是最深交互态，符合现有源字典。 |
| `--gp-focus-ring` | `var(--gp-brand-g600)` | 保持 | 焦点环必须使用稳定品牌主色并与背景形成足够对比。 |
| `--gp-sidebar-active-bg` | `var(--gp-primary-subtle)` | 保持 | 与组件映射的导航 active background 一致。 |
| `--gp-sidebar-sub-active-bg` | `var(--gp-alpha-white-10)` | 保持 | 深色或品牌侧栏中的子菜单需要独立可辨识层。 |

`--gp-primary-hover` 的五主题已批准源值：

| 主题 | Primary | Pressed | 已批准 hover |
|---|---|---|---|
| standard (E) | `#0D61F2` | `#084BC2` | `#0C5EEB` |
| business (A2) | `#1554B4` | `#103F8C` | `#1451AE` |
| future (D) | `#315CF5` | `#2546C7` | `#2F59EE` |
| sky (B) | `#1469D8` | `#0A4EAC` | `#1265D1` |
| ocean (C) | `#1769AA` | `#104B80` | `#1664A4` |

## 5. 兼容 API 的进一步确认原因

1. **公开 API 不能靠内部零引用直接删除。** 当前仓库内引用可以通过 `rg` 清空，但已发布包、外部页面、持久化主题值和第三方 Showcase 不在同一搜索范围内；删除前必须完成消费方清单和迁移公告。
2. **兼容 alias 不是第二套设计值。** 所有旧变量都应单向指向 canonical `--gp-*`。这保证主题切换、Density 和 Nuxt UI bridge 只有一个事实来源。
3. **兼容项的最佳值已获本次批准。** `--gp-font-xl`、`--gp-icon-size-md`、`--gp-surface-raised` 和 primary hover 已按批准值落地；后续同类像素或视觉变更仍需 Design Owner 批准。
4. **主题 ID 属于持久化契约。** 五个主题 ID 均为一等公开主题；用户已保存的选择可能引用任意一个，删除或重命名必须提供映射、迁移或回退策略。
5. **兼容清理必须绑定主版本。** 本次批准的是值，不是删除许可。后续仍按“登记消费方 → 新代码只用 canonical → 至少一个发布周期保留 alias → 主版本删除”执行。

## 6. `SEMANTIC_MAPPING.json:10-11` 兼容原因与批准结果

`src/theme/tokens/SEMANTIC_MAPPING.json` 第 10-11 行批准前为：

```json
"action.primary.hover": "brand.pressed",
"action.primary.pressed": "brand.pressed"
```

原因：

- 原主题字典只有 `brand.primary`、`brand.pressed`、`brand.accent`、`brand.light`、`brand.subtle`，没有独立的 `brand.hover`；
- 为了让 `hover` 和 `pressed` 两个组件语义都有合法来源，此前暂时将两者映射到同一个 `brand.pressed`；
- 这是兼容映射，不代表 hover 与 pressed 应具有相同视觉状态；本次已批准新增 `brand.hover` 并消除该弱反馈。

已批准并落地（2026-11-03）：

| 行 | 批准前映射 | 已批准映射 | 原因 |
|---|---|---|---|
| 10 | `action.primary.hover → brand.pressed` | `action.primary.hover → brand.hover`（新增） | hover 应比 default 深、比 pressed 浅；新增语义源可保持组件映射清晰。 |
| 11 | `action.primary.pressed → brand.pressed` | 保持 `brand.pressed` | pressed 是最深交互态，现有源值语义正确。 |

实施结果：五主题源字典已写入 `brand.hover`；生成 CSS 已输出 `--gp-brand-g500`；`SEMANTIC_MAPPING.json` 第 10 行已改为 `brand.hover`；第 11 行保持 `brand.pressed`；五主题 hover 视觉证据已复跑。

## 7. 修复顺序执行结果

1. 2026-11-03 人工批准本页第 4、6 节全部推荐值；
2. 已完成 Theme source（含五主题 `brand.hover`）和 generated CSS；
3. 已完成 alias 单向 canonical 收敛（icon、motion、density geometry、unprefixed V2.0 alias）；
4. Typecheck、Lint、生产/Showcase Build、五主题 token/视觉/hover、三密度几何均通过；
5. 本页状态与证据已更新。`COMPAT` 名称仍保留至少一个发布周期，本次不删除。

证据：`npm run quality:check` 输出至 `docs/quality/`，包含命令、退出码、日志和浏览器证据路径。

## 8. 框架全景

- 架构：Primitive JSON → 生成主题 CSS → semantic/component CSS → Nuxt UI bridge；Theme/Density/Typography/Layout manager 只写各自状态。
- 设计思路：统一 `--gp-*` 命名空间、单一来源、兼容 alias 单向映射、推荐值经人工审批后落值。
- 设计理念：一致性、正交性、可逆性、最小扩散、证据驱动。
- 落地路径：登记兼容 API → 人工批准推荐值 → 修改源 JSON/映射 → 生成 CSS → 全量验证（本次已完成）。
- 落地方案：兼容项至少保留一个发布周期；删除必须经过消费方清单和主版本迁移。门禁见 `docs/quality/QUALITY-GATES.md`。
