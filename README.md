## GPUStack Vue 工程基线 0.2.0（M1 结构整改候选）

原 React 2.3.0 不变。Theme 使用 Design System V2.4 的 standard/business/future 原始资源；Showcase 是独立开发/验收入口。

本包已完成依赖安装、生产/Showcase 类型检查、Lint 和真实构建验证。产品形态为**复制模板**（非 npm 安装包），接入与升级见 `docs/UPGRADING.md`；新增业务模块用 `npm run create:module -- <name>`。统一质量入口为 `npm run quality:check`；发布门禁要求干净候选版本、质量检查通过和候选版本对应的人工批准。详见 `docs/quality/QUALITY-GATES.md`。

命令：`npm install` → `npm run typecheck` → `npm run build` → `npm run build:showcase` → `npm run check:structure`。生产仅部署 dist，不部署 dist-showcase。

## 框架全景

- 架构：`src/main.ts` 初始化四个 Theme/Layout manager 和 Router/Nuxt UI；`src/App.vue` 在 `UApp` 内通过 `AppShell` 组织 Header、`UBreadcrumb`、`USidebarNav` 与 `RouterView`；Showcase 独立入口但复用 `src/`。
- 设计思路：Nuxt UI 优先，跨页面能力使用薄 `U*` 适配器；业务只消费 `--gp-*`；Primitive → Semantic → Component → Compatibility 单向 Token 管线。
- 设计理念：一致性、可访问性、正交性、可逆性、最小适配、证据驱动；Theme、Density、Typography、Layout 独立存储。
- 落地路径：基线审计 → 组件/命名收敛 → Token/主题 → 页面迁移 → Showcase/质量门禁 → 发布。
- 落地方案：每阶段绑定输入、输出、负责人、门禁、证据与回滚；兼容 API 推荐值已于 2026-11-03 获批并落地。权威说明见 `docs/README.md` 和 `docs/architecture/ARCHITECTURE.md`。
