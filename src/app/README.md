# src/app

应用级路由、导航和全局错误页面；不实现业务功能。

架构：入口在 `src/main.ts`；`router/routes.ts` 汇总各模块的 `routes.ts`；`navigation/nav.ts` 从路由元数据生成导航；`pages/` 放登录、SSO 入口、修改密码、403、404、服务不可用等应用级页面。
设计思路：路由、导航和标题使用同一份 `meta` 契约，模块不再同时修改路由与 `App.vue`。
设计理念：单一来源、最小职责、配置明确、失败可恢复。
落地路径：模块 `routes.ts` → 应用路由汇总 → 导航派生 → 类型检查与相关测试。
落地方案：认证/权限使用 HttpOnly Cookie + `is_admin`；当前所有业务路由均已启用 `requiresAuth`，管理员能力通过 `requiresAdmin` 或 `permissions` 按需启用。`/login` 根据 `/auth/config` 展示可选 SSO 入口，`/account/password` 使用真实的 `POST /auth/update-password` 契约。详见 `docs/architecture/AUTH-AND-PERMISSIONS.md`。
