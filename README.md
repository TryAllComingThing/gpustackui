## GPUStack Vue 工程基线 V1.1.1（M1 结构整改候选）

原 React 2.3.0 不变。Theme 使用 Design System V2.4 的 standard/business/future 原始资源；Showcase 是独立开发/验收入口。

本包完成目录契约的静态实现，**尚未通过依赖安装、真实构建和 Nuxt UI 兼容性验证**。Nuxt UI 依赖需先验证再锁定。

命令：`pnpm install` → `pnpm typecheck` → `pnpm build` → `pnpm build:showcase` → `pnpm check:structure`。生产仅部署 dist，不部署 dist-showcase。
