# Showcase

独立开发与组件预览入口，不属于生产路由。使用 `npm run dev:showcase`，主题、组件和 manager 均引用 `src/`，模拟数据只放在 `fixtures/`。

## 命令

```bash
npm run dev:showcase
npm run build:showcase
npm run test:showcase-smoke
```

## 结构

- `showcase/main.ts`：独立 Vite 入口与内存 Router。
- `showcase/App.vue`：主题、密度、外观、Token、组件、Pattern 和运行时状态总览。
- `showcase/sections/`：组件、状态、表格、表单、Pattern 与用户管理示例。
- `showcase/fixtures/`：本地数据，不调用后端。
- `showcase/component-matrix.ts`：当前 Showcase 覆盖的组件、状态与真实 fixture `data-testid`。

## 约束

- 生产与 Showcase 使用同一 `src/components`、`src/theme` 和 Theme/Density/Appearance/Typography/Layout manager；外观选择器使用 `#appearance-select` 与 `data-testid="appearance-select"`。
- 不创建第二套组件语义或只存在于 Showcase 的样式实现。
- Showcase 构建输出为 `dist-showcase/`，生产构建不得引用它。
- 新增组件覆盖时使用真实组件、本地 fixture、稳定 `data-testid` 和适用状态，并同步矩阵绑定。
