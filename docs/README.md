# GPUStack Vue 3 SaaS Framework Documentation

状态：`REVIEW / BLOCKED`。根 `DESIGN.md` 是唯一活动设计权威；本目录提供架构、设计、交付和质量的可追溯入口。

## 文档索引

| 文档 | 作用 |
|---|---|
| `DESIGN.md`（根目录） | 唯一活动设计规范与权威顺序。 |
| `docs/architecture/ARCHITECTURE.md` | 真实架构、分层、入口、组件/Token/Showcase/构建边界。 |
| `docs/design/FRAMEWORK-GUIDE.md` | 设计思路、设计理念、组件决策树与落地摘要。 |
| `docs/design/TOKEN-MAPPING.md` | Token 管线、公开兼容 API、已批准值及落地证据。 |
| `docs/design/THEME-CONTRACT.md` | 五主题 ID、源映射、生成文件和 manager 契约。 |
| `docs/design/COMPONENT-MATRIX.md` | Nuxt UI 原语与 `U*` 适配器、状态矩阵和 Provider 约束。 |
| `docs/quality/QUALITY-GATES.md` | npm 质量门禁命令、证据规则与发布判定。 |
| `docs/quality/PLAYWRIGHT-CONFIGS.md` | 四份 Playwright 配置的用途、端口和测试范围。 |


## 框架全景

- **架构**：`src/main.ts` 初始化 Theme/Density/Typography/Layout 与 Router/Nuxt UI，`src/App.vue` 在 `UApp` 内使用 `AppShell`，通过 `RouterView` 加载模块页面；生产与 Showcase 共用组件、Token 和 manager，仅隔离入口、fixtures 与构建产物。
- **设计思路**：Nuxt UI 优先，跨页面能力使用薄 `U*` 适配器；单一 `--gp-*` 命名空间；Primitive → Semantic → Component → Compatibility 单向 Token 链路；生产/Showcase 同源。
- **设计理念**：一致性、可访问性、正交性、可逆性、最小适配、证据驱动。Theme/Density/Typography/Layout 互不覆盖。
- **落地路径**：Phase 0 基线审计 → Phase 1 组件/命名收敛 → Phase 2 Token/主题 → Phase 3 页面迁移 → Phase 4 Showcase/质量门禁 → Phase 5 发布。
- **落地方案**：每阶段绑定输入、输出、负责人、门禁、证据路径和回滚；兼容 API 推荐值已于 2026-11-03 获批并落地；缺少测试/脚本/证据时保持 `BLOCKED`。

## 当前边界

- 旧组件前缀与旧 class 前缀已收敛到 `U*`/`gp-*`；`UBreadcrumb` 与 Nuxt UI 原语同名，内部使用 `NuxtBreadcrumb` 别名避免自递归。
- 当前以根 `DESIGN.md`、本目录、`docs/quality/open-defects.csv` 和真实源码为准。
- 发布门禁要求干净候选版本、`npm run quality:check` 通过和候选版本对应的人工批准；未满足时保持 `BLOCKED`。

