# src/app

应用级路由、布局和插件初始化；不实现业务功能。

架构：入口在 `src/main.ts`，路由在 `src/app/router/index.ts`，页面经 `RouterView` 进入模块。
设计思路：壳层与业务解耦，Router/Nuxt UI 只做应用级装配。
设计理念：最小职责、可逆配置、失败可回滚。
落地路径：入口审计 → 路由/权限冻结 → 页面迁移 → 构建与浏览器验证。
落地方案：业务 API/权限不改；路由变化必须补状态矩阵和证据。详见 `docs/architecture/ARCHITECTURE.md`。
