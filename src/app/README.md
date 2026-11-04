# src/app

应用级路由、导航和全局错误页面；不实现业务功能。

架构：入口在 `src/main.ts`；`router/routes.ts` 汇总各模块的 `routes.ts`；`navigation/nav.ts` 从路由元数据生成导航；`pages/` 只放 403/404 等全局页面。
设计思路：路由、导航和标题使用同一份 `meta` 契约，模块不再同时修改路由与 `App.vue`。
设计理念：单一来源、最小职责、可逆配置、失败可回滚。
落地路径：模块 `routes.ts` → 应用路由汇总 → 导航派生 → 类型检查与浏览器验证。
落地方案：认证/权限契约已冻结为 HttpOnly Cookie + `is_admin`；`requiresAuth`、`requiresAdmin`、`permissions` 保持 opt-in，当前业务路由未启用保护。详见 `docs/architecture/AUTH-AND-PERMISSIONS.md`。
