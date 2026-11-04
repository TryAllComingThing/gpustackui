# Showcase · M2
独立开发与验收入口，不属于生产路由。使用 `npm run dev:showcase`，主题与组件引用 `src/`。模拟数据仅放 `fixtures/`。生产构建不得引用 showcase。组件覆盖和浏览器测试属于 M2 待验收项。

## 框架全景

- 架构：独立 Vite 入口 `showcase/main.ts` + 内存 Router，直接复用生产 `src/components`、`src/theme` 与 Theme/Density/Typography/Layout manager。
- 设计思路：真实 Nuxt UI/U* 组件 + 本地 fixtures，不做第二套组件语义；生产与 Showcase 同源。
- 设计理念：可复现、可访问、状态矩阵完整、证据驱动，不使用后端或生产权限。
- 落地路径：fixtures → 状态矩阵 → 五主题/三密度 → 浏览器烟测 → 与生产构建边界核对。
- 落地方案：Showcase 构建独立输出；所有交互记录命令、退出码和证据路径。质量入口见 `docs/quality/QUALITY-GATES.md`。
