# 通用 Vue 3 SaaS 组件契约

组件契约源为 `design-system/contracts/COMPONENT_MATRIX.csv`。矩阵登记适用状态和验收要求，不代表每个组件已经在生产页面实现。

框架默认使用 Nuxt UI 原语。只有同时满足以下至少一项时，才允许保留薄 `U*` 适配器：跨页面状态或路由语义、递归数据装饰、统一无障碍契约、稳定公共 class/test id、项目布局行为。纯 prop 透传不得新建 `U*`。自定义适配器与 Nuxt UI 原语同名时（当前为 `UBreadcrumb`），必须在适配器内部显式导入原语并使用非同名局部别名，避免组件自递归。

| 适配器 | 状态 | 保留理由 |
|---|---|---|
| `USidebarNav` | KEEP | 合并 `activeKey`/`openItems` 状态，递归装饰当前项，包装 `onSelect`，并提供稳定的 `gp-sidebar-nav` 导航契约。直接在每个页面重复该逻辑会扩大状态漂移风险。 |
| `UDataTable` | KEEP | 封装排序、分页、选择、服务端查询、错误/空状态和可访问播报，属于跨页面行为。 |
| `UBreadcrumb` | KEEP (thin) | 仅提供统一 `aria-label`、`data-testid` 和 `gp-breadcrumb` class 契约。它与 Nuxt UI 原语同名，内部必须绑定 `NuxtBreadcrumb` 别名；若未来没有消费方，可直接使用原语。 |

Showcase 直接使用 `UModal`/`UDrawer`，生产与 Showcase 不保留并行适配语义。

控制类统一使用 `.gp-app-*` 前缀（`.gp-app-button`、`.gp-app-input`、`.gp-app-select`、`.gp-app-textarea`）；`.gp-*` 仅保留给 Token、布局和共享语义 class。矩阵中的实现列必须是可定位的真实组件或 class，不得填写“contract”占位文本；未实现能力应从覆盖矩阵移除或明确标记 `DEFERRED`。

生产与 Showcase 的组件根都必须包在 `UApp` 内，以提供 Nuxt UI 的 Tooltip、Overlay 和 Toast Provider。折叠 Sidebar 会启用 NavigationMenu tooltip；缺少 `UApp` 会导致运行时 injection error，而不是降级显示。

状态按适用性覆盖 default、hover、pressed、focus-visible、selected、disabled、readonly、loading、error、success、empty。

Modal 和 Drawer 已完成通用契约登记，但当前没有生产业务源码目标.

## 当前 Showcase 覆盖

以下原语已从 `DEFERRED` 升级为 `implemented`，并在 `showcase/sections/ComponentSection.vue` 使用本地 fixtures 验证：

| 组件 | 实现 | 已验证状态 |
|---|---|---|
| Radio | `URadioGroup` | default、focus、disabled、selected |
| Switch | `USwitch` | default、focus、disabled、loading、selected |
| Popover | `UPopover` | default、hover、focus、Escape |
| Upload | `UFileUpload` | default、hover、focus、disabled、success、error |
| Tree | `UTree` | default、focus、disabled、selected |
| Chart | `UChart` | default、empty、error，并消费 `--gp-chart-*` |

数据表格行操作支持图标与弹窗详情；Showcase 使用本地 fixture，不调用后端。任何后续范围回退必须移除对应演示或重新标记 `DEFERRED`，不得保留虚假的 `implemented` 状态。

## 框架全景

- 架构：App Shell 负责 Header/Sidebar/Main；页面优先使用 Nuxt UI 原语，跨页面状态进入 `src/components` 的薄 `U*` adapter，Pattern 组合跨越页面能力。
- 设计思路：组件命名统一 `U*`；`UBreadcrumb` 与原语同名时必须显式绑定 `NuxtBreadcrumb`；Showcase 与生产使用同一实现。
- 设计理念：最小适配、状态完整、可访问性内建、稳定 DOM/test-id 契约、生产与 Showcase 同源。
- 落地路径：识别跨页面需求 → 直接复用原语或建立薄 adapter → 覆盖状态矩阵 → Typecheck/Lint/Build → 浏览器复验。
- 落地方案：改动需记录源码映射、状态矩阵和验证证据；禁止新增纯 prop 透传 adapter。质量证据要求见 `docs/quality/QUALITY-GATES.md`。
