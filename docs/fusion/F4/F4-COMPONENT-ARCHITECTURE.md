# F4 组件架构审计

状态：**PASS**。F4 适配、生产 overlay、远程表格契约和严格验证均已完成；状态链见 F4 gate/state 证据。

## 版本与边界

- Vue `3.5.x`、Nuxt UI `4.12.0`、Vue Router `4.5.x`、Vite `6.x`。
- 唯一设计权威：根目录 `DESIGN.md`。
- Token 来源：`src/theme/tokens/`；F2 生成器和 F3 visual foundation 已从旧目录迁移。
- 主题 ID 仍为 `standard/business/future`，`sky/ocean` 是现有兼容运行时 ID；不引入 GPUStack Profile。
- Showcase 是独立验收入口，不是生产组件实现。

## 分层

```text
F3 Token / Theme / Density
        ↓
Nuxt UI 4 primitives (UButton/UInput/USelect/UForm/UTable/...)
        ↓
薄适配层 (DrpDataTable / DrpSidebarNav / DrpBreadcrumb)
        ↓
应用壳与页面组合 (AppShell / AppSidebarNav / route pages)
        ↓
Showcase fixtures and production route composition
```

### Layer 0：Token 与运行时

`src/theme/tokens/`、`src/theme/theme.manager.ts`、`density.manager.ts`、`layout.manager.ts`、`typography.manager.ts` 提供颜色、Typography、Density、Surface、几何和受控布局。组件只能引用 `--gp-*` 或 Nuxt UI bridge，不得复制 HEX 或建立 `--ds-*`。

### Layer 1：Nuxt UI 原语

Nuxt UI 4 已提供 Button、Input、Select、Form、FormField、Table、Pagination、Modal、Drawer、Popover、NavigationMenu、Breadcrumb、Checkbox、RadioGroup、Switch、Card、Tabs、Tooltip、Toast、Chart、FileUpload、Calendar、Skeleton、Empty 等能力。优先直接使用这些组件及其 `v-model`、slots、events；不为单个原语建立 Drp 包装。

### Layer 2：薄适配

- `DrpDataTable`：把业务需要的选择、排序、分页、空/加载状态组合到 UTable/UPagination；保留泛型行 ID 和稳定事件。
- `DrpSidebarNav`：把项目 active/open/collapsed 约束映射到 UNavigationMenu。
- `DrpBreadcrumb`：把项目 Breadcrumb 语义和 test id 映射到 UBreadcrumb。

这些适配层只统一跨页面行为和 Token 约束。它们不应重新声明 Nuxt UI 的所有 props、slots 或视觉变体。

### Layer 3：应用壳与页面

`AppShell` 保留 Header 60px、Sidebar 200px/64px 和 Header Breadcrumb；生产壳已统一使用 DrpSidebarNav/DrpBreadcrumb，旧手写组件文件仅为兼容保留。生产页面是路由组合，不应在页面中复制 Nuxt UI 原语或重新声明公共 API。

## 分类决策

| 分类 | 使用条件 | 当前例子 |
|---|---|---|
| REUSE | Nuxt UI 能直接满足需求，Token/契约可通过 props/ui/slots 接入 | UButton、UInput、USelect、UForm、UModal、UNavigationMenu |
| ADAPT | 需要跨页面统一状态、路由或 Token，但不改变原语 API | DrpDataTable、DrpSidebarNav、DrpBreadcrumb、AppShell、UCard |
| EXTEND | Nuxt UI 有能力但缺少上层组合契约，先登记 API/验证，不复制原语 | UChart + DataViz fallback、UDrawer production contract |
| REPLACE | 现有手写实现重复了 Nuxt UI 能力或造成 API/语义漂移 | AppSidebarNav → DrpSidebarNav/UNavigationMenu；AppBreadcrumb → DrpBreadcrumb/UBreadcrumb |
| DEFER | Nuxt UI 能力存在，但当前没有生产业务需求/契约/后端数据 | DatePicker、FileUpload、Tree、Chart 完整生产接入；Toast/Tabs/Empty/Loading 已有 Showcase 契约 |

## P0/P1 清单

| ID | 等级 | 问题 | 影响 | 建议分类 | 状态 |
|---|---|---|---|---|---|
| F4-P1-001 | P1 | `AppSidebarNav` 与 `DrpSidebarNav` 存在重复入口 | 旧 Props/API 需要兼容 | REPLACE | CLOSED：AppSidebarNav 已改为 DrpSidebarNav 转发适配 |
| F4-P1-002 | P1 | `AppBreadcrumb` 与 `DrpBreadcrumb` 存在重复入口 | 旧 Props/API 需要兼容 | REPLACE | CLOSED：AppBreadcrumb 已改为 DrpBreadcrumb 转发适配 |
| F4-P1-003 | P1 | 生产 Modal/Drawer 没有正式组件目标；UModal 仅在 Showcase | 生产 overlay 的焦点、Escape、恢复和 API 没有验收对象 | EXTEND | CLOSED：DrpModal/DrpDrawer 已建立并登记于 `PRODUCTION-OVERLAY-REGISTER.csv` |
| F4-P1-004 | P1 | `DrpDataTable` 对排序/分页是内部状态，缺少 server-side page/sort 公共事件 | 业务大数据表无法声明稳定的远程查询契约 | EXTEND | CLOSED：serverSide + query 契约已实现并由 Pattern 验证 |
| F4-P0-001 | P0 | 未发现当前源码级 P0 缺陷 | 无阻断性 API/安全问题证据 | — | CLOSED |
| F4-P1-007 | P1 | GPU 资源生产页面使用原生手写表格，未复用 DrpDataTable | 生产表格行为可能与公共状态契约分叉 | ADAPT | CLOSED：页面已迁移到 DrpDataTable，生产 E2E 退出码 0 |

## 架构约束

1. 新页面先查本清单和 Nuxt UI 4 d.ts；能直接使用原语时不得创建 Drp wrapper。
2. Drp 适配只能添加跨页面行为、Token、稳定 test id 或项目路由语义；不得镜像 Nuxt UI 全部 API。
3. 公共 API 变更必须更新 `F4-API-CONTRACT.md`、调用方和单元/E2E 证据。
4. 生产 Chart/FileUpload/DatePicker 只有在业务需求、状态矩阵和键盘契约明确后才能从 DEFER 转为 EXTEND/REUSE；Modal/Drawer 已有通用契约，可在业务页面直接组合。
5. `AppSidebarNav` 和 `AppBreadcrumb` 保留旧 Props/API，但内部只转发到 Drp 适配器，不得恢复手写导航或原生 anchor 实现。
