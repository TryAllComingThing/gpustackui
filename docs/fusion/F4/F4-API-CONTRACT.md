# F4 公共组件 API 契约

状态：**REVIEW**。这是审计得到的现有契约和 Nuxt UI 4 可用契约；本轮生产壳已接入 DrpSidebarNav/DrpBreadcrumb，Showcase 局部状态仍不作为生产公共 API。

## 自定义组件契约

### `AppShell`

源码：[src/components/layout/AppShell.vue](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/src/components/layout/AppShell.vue)

| 项目 | 契约 |
|---|---|
| Props | 无显式 props |
| v-model | `v-model:sidebarCollapsed:boolean` |
| Emits | `update:sidebarCollapsed:boolean`（由 `defineModel` 生成） |
| Slots | `brand`, `breadcrumb`, `actions`, `sidebar`, default |
| 约束 | Header 60px；Sidebar 200px/64px；Breadcrumb 默认 Header；不得在页面中重复壳布局 |

### `AppSidebarNav`

源码：[src/components/layout/AppSidebarNav.vue](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/src/components/layout/AppSidebarNav.vue)

| 项目 | 契约 |
|---|---|
| Props | `items: AppSidebarItem[]`，其中 `{ id, label, to?, children? }`；`collapsed?: boolean` |
| v-model | 无 |
| Emits | 无显式 emits；内部使用 RouterLink 和本地展开状态 |
| Slots | 无 |
| 审计结论 | 与 UNavigationMenu/DrpSidebarNav 重复，后续 REPLACE；本次不改实现 |

### `DrpSidebarNav`

源码：[src/components/common/DrpSidebarNav.vue](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/src/components/common/DrpSidebarNav.vue)

| 项目 | 契约 |
|---|---|
| Props | `items: NavigationMenuItem[]`；`collapsed?: boolean = false` |
| v-model | `v-model:activeKey:string`；`v-model:openItems:string[]` |
| Emits | `select(item: NavigationMenuItem)`；两个 model update events |
| Slots | 无自定义 slots；Nuxt UI item slots 由适配器内部使用 |
| 适用状态 | selected、expanded、collapsed、focus、keyboard |

### `AppBreadcrumb`

源码：[src/components/common/AppBreadcrumb.vue](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/src/components/common/AppBreadcrumb.vue)

| 项目 | 契约 |
|---|---|
| Props | `items: AppBreadcrumbItem[]`，`{ label, href?, current? }` |
| v-model/Emits | 无 |
| Slots | 无 |
| 审计结论 | 当前使用原生 anchor；与 UBreadcrumb/DrpBreadcrumb 重复，后续 REPLACE 为统一 Router/aria 契约 |

### `DrpBreadcrumb`

源码：[src/components/common/DrpBreadcrumb.vue](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/src/components/common/DrpBreadcrumb.vue)

| 项目 | 契约 |
|---|---|
| Props | `items: BreadcrumbItem[]`（Nuxt UI 4 类型） |
| v-model/Emits | 无 |
| Slots | 无自定义 slots；UBreadcrumb 原生 slots 可在未来显式透传 |
| 约束 | 稳定 `data-testid=breadcrumb`；项目默认 Header placement |

### `DrpDataTable<T extends { id: string }>`

源码：[src/components/common/DrpDataTable.vue](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/src/components/common/DrpDataTable.vue)

| 项目 | 契约 |
|---|---|
| Props | `data:T[]`、`columns:TableColumn<T>[]`、`loading?`、`error?`、`empty?`、`selectable?`、`pageSize?`、`total?`、`serverSide?` |
| v-model | `v-model:sorting:SortingState`、`v-model:pagination:PaginationState`；选择仍通过 `update:selectedRows` |
| Emits | `select(row:T)`；`update:selectedRows(rows:T[])`；`query({ sorting, pagination })`（仅 `serverSide`） |
| Slots | 无自定义 slots；列 cell/header 通过 Nuxt UI `TableColumn` 定义 |
| 兼容约束 | 行必须有字符串 `id`；分页、排序、选择行为保持现有语义 |
| 远程约束 | `serverSide=true` 时组件不本地排序/分页，通过 `query` 交给 loader；现有本地调用无需新增 props 即保持原行为 |

### `DrpModal` / `DrpDrawer`

源码：[src/components/common/DrpModal.vue](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/src/components/common/DrpModal.vue)、[src/components/common/DrpDrawer.vue](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/src/components/common/DrpDrawer.vue)

| 组件 | Props | v-model / Emits | Slots | 约束 |
|---|---|---|---|---|
| `DrpModal` | `title?`、`description?`、`dismissible?` | `v-model:open:boolean`；Nuxt UI overlay events 透传 | default/header/body/footer | 复用 UModal 的焦点陷阱、Escape、恢复焦点和 Token |
| `DrpDrawer` | `title?`、`description?`、`direction?`、`dismissible?` | `v-model:open:boolean`；Nuxt UI close/update events 透传 | default/header/body/footer | 复用 UDrawer 的方向、焦点陷阱、Escape、关闭按钮和 Token |

## 生产页面契约

`src/modules/*/pages/*.vue` 是 RouterView 页面，没有显式 Props/Events/Slots 公共 API；页面输入来自 route/API 约束，当前页面主要展示静态/fixture 状态。不得把这些页面局部变量提升为跨页面组件 API，除非先登记需求和迁移任务。

## Nuxt UI 4 原语契约摘要

以下基于安装版本 `@nuxt/ui@4.12.0` 的实际 d.ts，不是凭记忆推断。

| 原语 | 主要 Props | v-model / Events | Slots | F4 分类 |
|---|---|---|---|---|
| UButton | color、variant、size、disabled、loading、block、square | `click` | leading/default/trailing | REUSE |
| UInput | modelValue、type、placeholder、color、variant、size、disabled、required | `update:modelValue`、blur、change | leading/default/trailing | REUSE |
| USelect | items、modelValue、multiple、valueKey、labelKey、content、disabled | `update:modelValue`、change、blur、focus | leading/default/trailing/item/content-top/content-bottom | REUSE |
| UForm | schema、state、validate、disabled、validateOn、loadingAuto | submit、error | default(errors, loading) | REUSE |
| UFormField | label、name、error、help、description、required | 无 model | label/default/description/error/help | REUSE |
| UTable | data、columns、sorting/selection/pagination options | sorting、rowSelection、pagination 等 update events；select | column/header/cell/empty/loading | REUSE/ADAPT |
| UPagination | page、defaultPage、total、itemsPerPage、disabled | `update:page` | first/prev/next/last | REUSE |
| UModal | open、defaultOpen、dismissible、title、description、portal | `update:open` | header/body/footer/close | REUSE |
| UDrawer | open、direction、dismissible、snapPoints | `update:open`、`update:activeSnapPoint` | handle/header/content/footer | DEFER production |
| UNavigationMenu | items、orientation、type、collapsed、tooltip、popover、highlight | `modelValue` / `update:modelValue` | item/content/label | REUSE via Drp |
| UBreadcrumb | items、separator、icon、locale | 无 model | leading/item/separator/trailing | REUSE via Drp |
| UCheckbox | modelValue、disabled、required、name、value | `update:modelValue`、change | default/label/description | REUSE |
| URadioGroup | items、modelValue、disabled、required、loop | `update:modelValue`、change | item/label/description | DEFER |
| USwitch | modelValue、disabled、required、name | `update:modelValue`、change | thumb/label/description | DEFER |
| UCard | as、variant | 无 model | header/body/footer/default | ADAPT with gp surface |
| UTabs | items、modelValue、defaultValue、activationMode | `update:modelValue` | list/indicator/content/trigger | DEFER |
| UPopover | open、side、align、portal、openDelay、closeDelay | `update:open`、close:prevent | trigger/content/anchor | DEFER |
| UTooltip | text、side、delay、disabled | 无 model | default/content | DEFER |
| UChart | type、data、index、categories、colors、axes、legend、tooltip、aria | select、focusChange、focusGroupChange | tooltip/center | EXTEND after DataViz contract |
| UFileUpload | file/dropzone state props | file state events | file/item/header/footer | DEFER |
| UCalendar/UInputDate | date model/default/range/multiple options | `update:modelValue` | calendar/date cells | DEFER |
| USkeleton/UEmpty | loading/as/class; icon/title/description/actions | 无 model | default; header/body/actions/footer | DEFER |

## API 变更规则

1. 新增公共 Props/Events/Slots/v-model 必须先更新本文件和 F4 inventory。
2. 适配层不得把 Nuxt UI 原语所有 API 镜像出来；只暴露跨页面必要契约。
3. 现有 `DrpDataTable` 的 server-side 扩展必须保留当前 `data/columns/selectable/pageSize/total` 调用方式。
4. 生产 overlay、Chart、FileUpload、DatePicker 进入实现前必须补充状态矩阵、键盘/焦点契约、Token 映射和真实测试。
