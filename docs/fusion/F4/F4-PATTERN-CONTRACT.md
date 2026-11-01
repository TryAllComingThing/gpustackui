# F4 通用交互 Pattern 契约

## ComplexFormPattern

源码：[src/components/patterns/ComplexFormPattern.vue](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/src/components/patterns/ComplexFormPattern.vue)

- `schema: z.ZodTypeAny`：兼容当前 Zod 3.24 的 `safeParse` 与 `superRefine`，跨字段规则由调用方定义。
- `initialState`、`fields`：只描述字段和初始值，不复制 UForm/UFormField/UInput/USelect 实现。
- `submitter(state)`：异步提交回调；Pattern 负责禁用表单、按钮 loading、异常提示、成功反馈和重置。
- Emits：`submit`、`success`、`error`、`reset`。
- 键盘和无障碍：复用 UFormField 标签/错误关联、UInput/USelect 原生键盘语义、`role=status`/`role=alert`。

## DataTablePattern

源码：[src/components/patterns/DataTablePattern.vue](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/src/components/patterns/DataTablePattern.vue)

- `rows`、`columns`、`searchKeys`、`filters`、`rowActions`：用于本地 fixture 或页面组合。
- `load(query)`：可选异步远程 loader，接收搜索、筛选、`SortingState` 和 `PaginationState`，返回 `{ data, total }`。
- Pattern 只组合 UInput/USelect 和 DrpDataTable；排序、分页和 loading/error/empty 由公共适配器处理。
- 行操作通过 UButton 生成稳定可访问名称；表格保留 UTable 的排序按钮、选择和分页键盘行为。
- 响应式由 Token 和 Showcase 的窄视口 CSS 控制，工具栏可换行，表格保持最小宽度和滚动能力。

Showcase 入口：`showcase/sections/PatternSection.vue`，数据完全为本地模拟数据，不调用后端。
