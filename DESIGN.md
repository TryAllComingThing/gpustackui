# GPUStack UI Design System V2.4 — Header Breadcrumb Edition

> 状态：设计权威与工程样式资产已生成；真实 GPUStack 项目接入、Nuxt UI 版本兼容及浏览器测试尚未执行。

## 1. 设计目标与权威顺序

本文件是 GPUStack UI 的唯一视觉设计权威。优先级：本 DESIGN.md → theme CSS → tokens.css → GPUStack 组件适配层 → Nuxt UI 默认值。业务页面禁止硬编码主题颜色。

三个浅色主题：standard 标准科技蓝（默认）、business 沉稳商务蓝、future 蓝紫未来科技。主题切换只改变颜色与相应状态色，不改变页面布局、字号、间距、圆角、业务权限或 API。

## 2. 完整主题色彩矩阵

| Token | 标准科技蓝 | 沉稳商务蓝 | 蓝紫未来科技 |
|---|---|---|---|
| Brand G600 主色 | #0D61F2 | #1554B4 | #315CF5 |
| Brand G900 点击/深色 | #084BC2 | #103F8C | #2546C7 |
| Brand G400 亮色 | #3585FF | #2465C5 | #2D53DF |
| Brand G300 浅色 | #A9CFFF | #A9C7F4 | #B9C7FF |
| Brand G100 浅色背景 | #EAF3FF | #E8F1FF | #EDF0FF |
| Success 默认 | #167D49 | #15803D | #167A51 |
| Success 点击 | #126339 | #166534 | #115D40 |
| Success 悬浮 | #157446 | #16783C | #147049 |
| Success 浅色 | #AEE2C1 | #A7DFB8 | #B0E3CE |
| Success 背景 | #EAF8F0 | #EAF8EF | #ECF9F2 |
| Warning 默认 | #995000 | #9A4D00 | #9A4E00 |
| Warning 点击 | #7A4000 | #7C3E00 | #7C3F00 |
| Warning 悬浮 | #8E4A00 | #914800 | #914900 |
| Warning 浅色 | #F3CAA2 | #F5C99D | #F6D0A8 |
| Warning 背景 | #FFF4E7 | #FFF4E6 | #FFF5E9 |
| Danger 默认 | #D12C38 | #DC2626 | #D42D46 |
| Danger 点击 | #AA202C | #B91C1C | #AE2037 |
| Danger 悬浮 | #BF2733 | #C52222 | #C12740 |
| Danger 浅色 | #F3B6BC | #F5B4B2 | #F5B6BF |
| Danger 背景 | #FFF0F1 | #FDECEC | #FFF0F2 |
| Info 默认 | #1459BD | #155CC4 | #5555C9 |
| Info 点击 | #104594 | #10469B | #4141A4 |
| Info 悬浮 | #1353AF | #1454B2 | #4D4DB9 |
| Info 浅色 | #B8D7FF | #B4D7FF | #C7C8FF |
| Info 背景 | #ECF5FF | #EAF3FF | #F0F0FF |
| Text N900 | #202B3D | #1F2937 | #24263A |
| Text N800 | #35445B | #374151 | #42465F |
| Text N600 | #51637A | #596579 | #5B607A |
| Text N500 | #5F7088 | #607086 | #696F88 |
| Text N400 | #8D9CB0 | #8995A6 | #969BB2 |
| Line N300 | #C9D7E8 | #CDD7E3 | #D4D9EC |
| Line N250 | #E0E9F4 | #E2E8F0 | #E5E8F4 |
| Line N200 | #EDF3FA | #EDF1F6 | #F0F1FA |
| Background 禁用 | #F0F5FC | #F1F4F8 | #F1F2FA |
| Background N150 页面 | #F6F9FE | #F5F8FC | #F7F8FF |
| Background N100 表头 | #FAFCFF | #FAFBFD | #FBFBFF |
| Background 白色 | #FFFFFF | #FFFFFF | #FFFFFF |

**透明度公共 Token**：黑色 90/60/30/10/5：`#000000E6` / `#00000099` / `#0000004D` / `#0000001A` / `#0000000D`；白色 90/60/30/10/5：`#FFFFFFE6` / `#FFFFFF99` / `#FFFFFF4D` / `#FFFFFF1A` / `#FFFFFF0D`。

## 3. Token 分层与使用规则

L1 基础：每套主题保留全部用户指定的品牌/状态/文字/线条/背景色；L2 语义：`--gp-primary`、`--gp-text-primary`、`--gp-border-default`；L3 场景：`--gp-header-bg`、`--gp-sidebar-bg`、`--gp-page-bg`、`--gp-card-bg`；L4 组件适配；L5 页面只消费语义变量。

注意：`G400` 是色阶名称而不是 hover 的保证。当前 `--gp-primary-hover` 显式映射 G900；可在真实交互评审后另行指定。白色文本在浅色背景上必须校验对比度。

## 4. 字体与视觉层级

| 元素 | 字号/行高 | 字重 | 颜色 |
|---|---|---|---|
| 页面标题 | 24/32px | 600 | N900 |
| 模块标题 | 18/26px | 600 | N900 |
| 卡片标题 | 16/24px | 600 | N900 |
| 正文、表格 | 14/22px | 400 | N900 |
| 次要说明 | 13/20px | 400 | N600 |
| 帮助文字 | 12/18px | 400 | N600 |
| KPI 数值 | 28–32/36–40px | 600–700 | N900 |
| 一级导航 | 14px | 500 | 侧栏语义色 |
| 二级导航 | 13px | 400；选中500 | 侧栏语义色 |

字体栈：Inter → 系统 UI → PingFang SC → Microsoft YaHei → Noto Sans CJK SC → sans-serif。指标数字使用 tabular-nums；N400 只用于弱提示/装饰，不用于需要阅读的常规正文。

## 5. 页面尺寸与布局

| 元素 | 规范 |
|---|---|
| Header | 高 60px，G600，白色文字与图标 |
| Logo 与折叠按钮 | 同在 Header，间距 20px；按钮命中 40×40px，图标20px |
| Sidebar | 展开 200px / 收缩 64px，背景 G900 |
| 一级菜单 | 44px 行高、左右12px、图标18px、文字14px/500 |
| 二级菜单 | 40px 行高、缩进26px、图标16px、文字13px |
| 主内容区 | N150 背景，水平 padding 24px，自适应 min-width:0 |
| 面包屑 | **Header 内**，位于品牌/折叠按钮与右侧操作区之间；不在工作区重复展示 |
| 过渡 | 200ms，尊重 prefers-reduced-motion |
| 移动端 | <768px 抽屉导航，内容区16px padding |

一级菜单与二级菜单均必须配置语义清晰的 Lucide 图标。收缩态一级菜单保持 44px 点击高度；子菜单使用锚定浮层，提供完整图标/文字、键盘访问、Escape 关闭、焦点恢复。长菜单省略号并提供键盘可触达的完整提示。

## 6. 圆角、间距与阴影

标签3px；按钮、输入、菜单4px；卡片6px；弹窗、浮层8px；表格单元格0px。间距基准4px：4/8/12/16/20/24/32px。卡片轻阴影、浮层中阴影、模态强阴影均使用 `--gp-shadow-*`。

## 7. 页面色彩应用

| 页面区域 | 语义变量 |
|---|---|
| Header | `--gp-header-bg` / `--gp-header-fg` |
| Sidebar | `--gp-sidebar-bg` / `--gp-sidebar-fg` |
| 一级选中 | `--gp-sidebar-active-bg` / `--gp-sidebar-active-fg` |
| 二级选中 | `--gp-sidebar-sub-active-bg` / `--gp-sidebar-sub-active-fg` |
| 主工作区 | `--gp-page-bg` |
| 卡片与弹窗 | `--gp-card-bg` |
| 表头 | `--gp-table-head-bg` |
| 文字 | `--gp-text-primary` / `--gp-text-secondary` |
| 分隔线 | `--gp-border-default` |
| 主按钮 | `--gp-primary` / `--gp-primary-hover` / `--gp-primary-pressed` |
| 图表 | `--gp-chart-1` 至 `--gp-chart-5`，必须配合形状/标签辨识 |

## 8. 组件视觉与交互规范

| 组件 | 视觉规范 | 必测状态 |
|---|---|
| Button | 4px圆角，14px/500，主按钮使用 primary | default/hover/pressed/focus/disabled/loading |
| Input/Select/Textarea | 4px圆角，卡片背景，N250边框 | focus/error/disabled/readonly |
| Card | 6px圆角，白色表面，N250边框，轻阴影 | default/hover(如可点击) |
| Table | 14px正文，N100表头，12px×16px单元格内边距 | hover/selected/empty/loading |
| Badge | 3px圆角，12px字号，语义背景和语义文字 | success/warning/danger/info |
| Modal/Popover | 8px圆角，主题表面色，适当阴影 | focus trap/Escape/restore |
| Tabs/Pagination | 主题 primary 选中，明确焦点 | active/focus/disabled |
| Charts | 主题色阶、语义标签、工具提示 | contrast/legend/tooltip |

主题切换不应触发业务组件重新挂载、清空表单或重置筛选。弹窗、Tooltip、Dropdown 等 Teleport 到 body 的内容必须继承根元素 data-theme。

## 9. 主题管理契约

主题 ID 固定 `standard` / `business` / `future`。由应用入口调用 `initTheme()` 一次；通过 `useTheme()` 读取只读状态并调用 `setTheme()`。`data-theme` 写到 document.documentElement，localStorage 持久化，存储不可用时降级默认主题。要彻底避免首次错误主题闪烁，可在 HTML 入口的首屏脚本中同步设置 data-theme；需按实际 CSP 约束实施。

## 10. Nuxt UI 集成边界

`app.config.ts` 只是 Nuxt UI 配置候选。Vue3 + Vite 独立项目必须验证当前 Nuxt UI 版本的插件、主题注册方式、Tailwind v4 CSS `@theme` 映射与组件 slots/defaultVariants 兼容性。不能把 `primary: "primary"` 当作已完成颜色注册。推荐通过 CSS 语义变量及 Gp* 适配组件落实最终视觉。

## 11. Codex 强制规则

1. 业务页面禁止直接写 HEX/RGB 主题色、禁止直接写 `bg-blue-*` 等颜色类。
2. 只能通过语义 Token 获取主题颜色；新增主题必须完整提供全部 Token。
3. 不修改已有业务 API、权限、路由语义和数据契约。
4. 所有二级菜单必须有 16px Lucide 图标，一级18px。
5. Header 内折叠按钮、侧栏200/64px、内容24px、面包屑固定在 Header 内，不得移至工作区。
6. 新组件必须通过三主题状态矩阵。
7. 不得用截图视觉正确替代实际功能验收。
8. 不得宣称未执行的构建、测试或专家评审已通过。

## 12. 验收矩阵

| 编号 | 验收项 |
|---|---|
| MT-01 | 三主题全量颜色与提供的 HEX 一一对应 |
| MT-02 | Header/Sidebar/页面/卡片/表格跟随主题 |
| MT-03 | 按钮、输入、表格、弹窗、徽标状态齐全 |
| MT-04 | 字体、字号、间距、圆角跨主题一致 |
| MT-05 | 一级、二级图标正确；收缩浮层可用 |
| MT-06 | 主题切换不丢表单和业务状态 |
| MT-07 | 刷新后主题持久化；首次渲染无明显闪烁 |
| MT-08 | 1440/1024/390 三视口视觉回归 |
| MT-09 | WCAG AA 对比度、键盘、焦点与 axe-core |
| MT-10 | vue-tsc、Vite 构建、Playwright 通过 |

## 13. 交付文件与状态

`src/assets/styles/tokens.css`、`themes/*.css`、`typography.css`、`layout.css`、`components.css`、`main.css`、`src/theme/*`、`src/composables/useTheme.ts`、`app.config.ts`、`tests/theme/README.md`。本包为可集成资产，非已运行的完整 GPUStack UI。


## V2.4 强制修订：Header 内面包屑（替代此前所有内容区面包屑约束）

- 全局 Header 高度保持 60px。左侧 Logo + 折叠按钮；中部 `AppBreadcrumb`；右侧通知/用户操作。
- 面包屑必须在 Header 内，禁止在 `AppPageHeader` 或工作区标题上方重复渲染。工作区从页面标题和说明开始。
- 面包屑文本使用白色/白色透明度，当前节点白色 600；分隔符白色 60%。普通文本须经对比度检查。
- 中间导航区域使用 `min-width:0; flex:1; overflow:hidden`，长路径截断；当前节点完整名称可通过 title 或可访问浮层获取。
- 使用 `<nav aria-label="当前位置">`、有序层级、当前节点 `aria-current="page"`；中间层级可点击并由路由元数据生成，禁止显示原始 ID。
- 响应式：窄屏优先保留当前页面名称；必要时收起祖先路径，通过可访问的路径菜单展开，禁止挤占折叠按钮和用户操作。
- 主题：Header 背景使用 `--gp-header-bg`，面包屑白色前景；三套主题均保持位置、字号与交互一致。
- 组件：`AppShell.vue` 在 Header 中渲染 `AppBreadcrumb.vue`，工作区仅渲染 `AppPageHeader.vue`。
- 质量门禁 BC-01 Header 中存在唯一面包屑；BC-02 工作区无重复；BC-03 三主题对比度；BC-04 桌面/窄屏溢出；BC-05 路由/动态名称/键盘可达。
