# 通用 Vue 3 SaaS 组件契约

组件契约以本文件和 Showcase 实际实现为准。框架默认使用 Nuxt UI 原语，只有满足以下至少一项时才保留薄 `U*` 适配器：跨页面状态或路由语义、递归数据装饰、统一无障碍契约、稳定公共 class/test id、项目布局行为。纯 prop 透传不得新建 `U*`。

## 适配器

| 适配器 | 保留理由 |
|---|---|
| `USidebarNav` | 合并 `activeKey`/`openItems` 状态，递归装饰当前项，包装 `onSelect`，并提供稳定的 `gp-sidebar-nav` 导航契约。 |
| `UDataTable` | 负责模板编排、服务端查询、错误/空状态和可访问契约；排序、分页转换与行选择状态由 `src/composables/useDataTable.ts`、`src/composables/dataTableState.ts` 承载。`DataTablePattern` 对远程搜索和筛选做防抖合并并重置页码。 |
| `UBreadcrumb` | 提供统一 `aria-label`、`data-testid` 和 `gp-breadcrumb` class 契约。与 Nuxt UI 原语同名，内部必须绑定 `NuxtBreadcrumb` 别名。 |

Showcase 直接使用 `UModal`/`UDrawer`，生产与 Showcase 不保留并行适配语义。

控制类统一使用 `.gp-app-*` 前缀（`.gp-app-button`、`.gp-app-input`、`.gp-app-select`、`.gp-app-textarea`）；`.gp-*` 仅保留给 Token、布局和共享语义 class。矩阵中的实现列必须是可定位的真实组件或 class。

生产与 Showcase 的组件根都必须包在 `UApp` 内，以提供 Nuxt UI 的 Tooltip、Overlay 和 Toast Provider。折叠 Sidebar 会启用 NavigationMenu tooltip；缺少 `UApp` 会导致运行时 injection error。

状态按适用性覆盖 default、hover、pressed、focus-visible、selected、disabled、readonly、loading、error、success、empty。

## Showcase 覆盖

| 组件 | 实现 | 覆盖状态 |
|---|---|---|
| Button | `UButton` / `.gp-app-button` | default、hover、focus、disabled、loading |
| Input / Textarea / Select | `UInput`、`UTextarea`、`USelect` | default、focus、disabled、error |
| Form | `UForm + UFormField` | default、error、disabled |
| Table | `UDataTable + UTable + DataTablePattern` | default、loading、empty、selected、debounced search |
| Modal / Drawer | `UModal`、`UDrawer` | default、focus、Escape、focus restore |
| Navigation | `USidebarNav + UNavigationMenu + UBreadcrumb` | default、focus、selected、expanded、collapsed |
| DatePicker / Checkbox / Radio / Switch | `UInputDate`、`UCheckbox`、`URadioGroup`、`USwitch` | default、focus、disabled、selected |
| Card / Tabs / Tooltip / Popover | `UCard`、`UTabs`、`UNavigationMenu Tooltip`、`UPopover` | default、hover、focus、disabled |
| Toast / Pagination / Upload / Tree / Chart | `useToast()`、`UPagination`、`UFileUpload`、`UTree`、`UChart` | default、success、error、empty、loading |
| Skeleton / Empty | `USkeleton`、`UEmpty` | loading、empty |

未出现在上表的组件或状态不表示框架缺失，只表示当前 Showcase 没有对应演示。新增覆盖时使用真实组件、本地 fixture 和稳定 `data-testid`，不要登记占位实现。

数据表格行操作支持图标与弹窗详情；Showcase 使用本地 fixture，不调用后端。
