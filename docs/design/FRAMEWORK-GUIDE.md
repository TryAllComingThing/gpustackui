# Vue 3 SaaS Framework Design Guide

根 `DESIGN.md` 是唯一活动设计权威；本文件解释设计思路、组件决策和落地方式，不创建第二套规范。

## 1. 架构位置

框架由六部分组成：

1. **产品壳**：`src/App.vue` + `AppShell`，提供 Header、Breadcrumb、Sidebar、Main 和移动端折叠。
2. **Nuxt UI 原语**：表单、表格、弹层、导航、分页、提示等默认能力。
3. **薄 `U*` 适配器**：只承载跨页面状态、递归装饰、无障碍和稳定测试契约。
4. **Token/runtime**：Theme、Density、Appearance、Typography、Layout manager 与 `--gp-*` 管线。
5. **Showcase**：本地 fixtures 的独立预览入口。
6. **产品配置与示例**：`src/config/product.ts` 统一品牌与示例开关；GPUStack 专用 GPU 页面位于可选示例目录。

完整分层、入口和边界见 `docs/architecture/ARCHITECTURE.md`。

## 2. 设计思路

### 2.1 Nuxt UI 优先，适配器最小化

- 页面默认直接使用 Nuxt UI 4，减少重复实现和无障碍回归。
- 只有跨页面能力才创建 `U*` 适配器；纯样式包装应直接使用 Tailwind/语义 class。
- `USidebarNav`、`UDataTable`、`UBreadcrumb` 分别处理导航状态、数据表编排和面包屑 DOM 契约；表格排序/分页/选择状态由 `useDataTable` 与纯辅助函数承载。
- `UBreadcrumb` 与 Nuxt UI 原语同名，因此内部必须使用 `NuxtBreadcrumb` 显式别名；这是本项目唯一需要特别处理的同名适配器。

### 2.2 单一 Token 命名空间

- 业务组件只消费 `--gp-*`；Nuxt UI 通过 `nuxt-ui.bridge.css` 消费同一来源。
- Primitive 来自主题 JSON，semantic/component 来自 CSS alias，compatibility 只做单向映射。
- 禁止 `--ds-*`、主题 HEX 硬编码、页面级变量复制和手工维护生成主题 CSS。

### 2.3 正交状态

- `data-theme`、`data-density`、`data-appearance`、`data-appearance-preference`、`data-typography`、`data-breadcrumb-placement` 各自负责一类状态。
- Theme 切换不能改变 Density 或 Appearance；Density 切换不能改变主题色；Appearance 只解析浅色/深色语义，不改变主题 ID；Layout 配置不能改变业务状态。
- 持久化键分别独立，避免一个设置覆盖另一个设置。

### 2.4 兼容优先

- V2.x/V2.0 兼容 API 保留 alias，并通过消费方清单和主版本策略清理。
- 新代码只使用 canonical `--gp-*` 名称；兼容 alias 单向指向 canonical。
- `SEMANTIC_MAPPING.json` 分别映射 `brand.hover` 与 `brand.pressed`，两者由不同主题 Token 派生。

### 2.5 产品配置与示例解耦

- `VITE_APP_NAME` 是壳层、登录页、文档标题和面包屑的唯一品牌输入，默认使用中性名称 `Vue SaaS Framework`。
- `VITE_APP_BASE` 配置部署子路径，并同时成为 Vite base 与 Router history base；非法或路径穿越值回退 `/`。
- `VITE_ENABLE_DEMO_MODULES=true` 才注册资源、模型、部署和服务 fixtures 示例；默认关闭，保持框架壳层和设置页可用。
- `VITE_ENABLE_GPUSTACK_EXAMPLE=true` 才注册 GPUStack 专用 GPU 资源路由；默认关闭，E2E 通过 `.env.e2e` 显式启用。
- `VITE_SSO_LOGIN_URL` 只在 `/auth/config` 报告 SAML/OIDC 可用时展示；仅接受站内绝对路径或 HTTPS URL。
- 通用模块、认证、主题、组件和服务基础设施不得依赖 `src/modules/resources/examples/gpustack/`。
- GPU 设备 API 继续通过 `src/api/resources/gpu-device.ts` 暴露，示例开关不改变 `GET /api/gpu-devices` 契约。

## 3. 设计理念

| 理念 | 判断标准 |
|---|---|
| 一致性 | 同一操作在页面、Showcase、不同主题和密度下具有相同语义与状态。 |
| 可访问性 | 键盘、焦点、语义名称、错误关联、Escape 和焦点恢复是完成条件。 |
| 正交性 | Theme/Density/Appearance/Typography/Layout 不互相写入或覆盖。 |
| 兼容性 | 兼容 alias 单向指向 canonical；破坏性变更提供迁移方式。 |
| 最小适配 | 纯 prop 透传不新建 `U*`；跨页面状态才允许 adapter。 |
| 最小惊讶 | 组件命名、Token 命名和状态行为与 Nuxt UI/业务既有契约一致。 |

## 4. 组件决策树

```text
需要 UI 能力？
  ├─ Nuxt UI 已有且满足 → 直接用 Nuxt UI 原语
  ├─ 仅视觉差异 → Tailwind / gp-* class / theme token
  ├─ 跨页面状态、递归、无障碍或稳定 DOM 契约 → 薄 U* 适配器
  └─ 页面私有业务组合 → 页面内组合或 Pattern
```

反例：

- 仅为传递 props 建 `U*`；
- 为每个页面复制 Sidebar 装饰逻辑；
- 在业务页直接写主题 HEX；
- 用 `AppBreadcrumb` 或旧 Breadcrumb adapter 等平行命名替代统一 adapter；
- 在适配器模板内使用与自身同名的 Nuxt UI 原语。

## 5. 交互与状态矩阵

按适用性覆盖：

- 基础：default、hover、pressed、focus-visible、selected、disabled、readonly；
- 数据：loading、error、success、empty；
- 浮层：open、closing、Escape、outside interaction、focus restore；
- 导航：active、expanded、collapsed、nested、keyboard；
- 表格：sorting、pagination、row selection、server query、overflow。

Showcase 使用同一组件实现和本地 fixture，不创建第二套组件语义。

## 6. 开发路径

1. 读取根 `DESIGN.md`、相关 Skill、真实源码和测试配置。
2. 清点命名与组件覆盖，确认是否已有 Nuxt UI 原语或共享 adapter。
3. 修改 Token 源或组件实现，保持 Theme/Density/Appearance 正交。
4. 在 Showcase 补充本地 fixture 和状态覆盖。
5. 运行受影响的 typecheck、lint、unit、showcase、accessibility 和 build。
6. 同步文档、i18n、路由和测试。

## 7. 工程约定

- **开发**：Nuxt UI 为主、`U*` 适配为辅，页面只引用 `--gp-*`。
- **设计**：Token 改动先进入源 JSON/映射表，再生成 CSS，不在页面打补丁。
- **兼容**：alias 单向指向 canonical；破坏性变更通过 ADR 记录。
- **Showcase**：生产与 Showcase 分别构建；五主题、三密度、桌面/移动、键盘和弹层使用同一实现。
- **协作**：代码评审关注行为、可访问性、API 契约和复用。
