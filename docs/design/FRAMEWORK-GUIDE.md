# GPUStack Vue 3 SaaS Framework Design Guide

状态：`REVIEW`。根 `DESIGN.md` 是唯一活动设计权威；本文件解释设计思路与设计理念，不创建第二套规范。

## 1. 架构位置

框架由五部分组成：

1. **产品壳**：`src/App.vue` + `AppShell`，提供 Header、Breadcrumb、Sidebar、Main 和移动端折叠。
2. **Nuxt UI 原语**：表单、表格、弹层、导航、分页、提示等默认能力。
3. **薄 `U*` 适配器**：只承载跨页面状态、递归装饰、无障碍和稳定测试契约。
4. **Token/runtime**：Theme、Density、Typography、Layout manager 与 `--gp-*` 管线。
5. **Showcase/Quality**：本地 fixtures 的独立验收入口和证据驱动门禁。

完整分层、入口和边界见 `docs/architecture/ARCHITECTURE.md`。

## 2. 设计思路

### 2.1 Nuxt UI 优先，适配器最小化

- 页面默认直接使用 Nuxt UI 4，减少重复实现和无障碍回归。
- 只有跨页面能力才创建 `U*` 适配器；纯样式包装应直接使用 Tailwind/语义 class。
- `USidebarNav`、`UDataTable`、`UBreadcrumb` 分别处理导航状态、数据表状态和面包屑 DOM 契约。
- `UBreadcrumb` 与 Nuxt UI 原语同名，因此内部必须使用 `NuxtBreadcrumb` 显式别名；这是本项目唯一需要特别处理的同名适配器。

### 2.2 单一 Token 命名空间

- 业务组件只消费 `--gp-*`；Nuxt UI 通过 `nuxt-ui.bridge.css` 消费同一来源。
- Primitive 来自主题 JSON，semantic/component 来自 CSS alias，compatibility 只做单向映射。
- 禁止 `--ds-*`、主题 HEX 硬编码、页面级变量复制和手工维护生成主题 CSS。

### 2.3 正交状态

- `data-theme`、`data-density`、`data-typography`、`data-breadcrumb-placement` 各自负责一类状态。
- Theme 切换不能改变 Density；Density 切换不能改变主题色；Layout 配置不能改变业务状态。
- 持久化键分别独立，避免一个设置覆盖另一个设置。

### 2.4 兼容优先、批准后落值

- V2.x/V2.0 兼容 API 先保留 alias，再通过消费方清单和主版本策略清理。
- 兼容 API 的“批准前值”与“已批准值”分开记录；本次推荐值已于 2026-11-03 获批并落地。
- `SEMANTIC_MAPPING.json:10-11` 的 hover/pressed 同源是兼容妥协，不是最终视觉设计。

## 3. 设计理念

| 理念 | 判断标准 |
|---|---|
| 一致性 | 同一操作在页面、Showcase、不同主题和密度下具有相同语义与状态。 |
| 可访问性 | 键盘、焦点、语义名称、错误关联、Escape 和焦点恢复是完成条件。 |
| 正交性 | Theme/Density/Typography/Layout 不互相写入或覆盖。 |
| 可逆性 | 兼容 alias、布局配置和发布变更都有明确回滚方式。 |
| 证据驱动 | 命令、退出码、环境、报告路径和修复结果缺一不可。 |
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

Showcase 必须展示同一组件实现和本地 fixture，不创建第二套组件语义。

## 6. 落地路径

1. 读取根 `DESIGN.md`、相关 Skill、真实源码和测试配置；
2. 清点命名与组件，统一 `U*`，消除旧组件前缀与旧 class 前缀；
3. 收敛 Token 管线，保留 compatibility alias；推荐值获批后落入源 JSON、映射和生成 CSS；
4. 逐页面迁移，冻结 API、权限、认证与异步状态；
5. 补齐 Showcase、自动化测试和视觉/无障碍证据；
6. 通过门禁、人工批准和回滚演练后才进入发布。

详细阶段、负责人和回滚按上述门禁与证据要求执行。

## 7. 落地方案

- **开发**：Nuxt UI 为主、`U*` 适配为辅，页面只引用 `--gp-*`。
- **设计**：Token 改动先进入源 JSON/映射表，再生成 CSS，不在页面打补丁。
- **验收**：生产与 Showcase 分别构建；浏览器验证五主题、三密度、桌面/移动、键盘和弹层。
- **兼容**：alias 至少保留一个发布周期；本次批准只改变已列值语义，不代表允许删除兼容 API。
- **发布**：真实 PASS gate + 人工批准；缺少测试或证据时保持 `BLOCKED`。

框架全景：架构见 `docs/architecture/ARCHITECTURE.md`；设计思路与设计理念见本文件；质量门禁见 `docs/quality/QUALITY-GATES.md`。

