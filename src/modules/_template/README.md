# 模块模板

复制本目录结构新增业务域模块，禁止跨模块导入私有实现。

约定：
- 页面放在 `src/modules/<域>/pages/`，根节点带 `data-testid="production-<域>"`。
- 文案使用 i18n key，注册到 `src/locales/zh-CN.ts` 与 `src/locales/en-US.ts`。
- 路由在 `src/app/router/index.ts` 注册 `meta.titleKey` 与 `meta.breadcrumbKeys`。
- 导航在 `src/App.vue` 的 `navItems` 注册。
- 只消费 `--gp-*`、薄 `U*` adapter 与 Pattern，不在共享层写业务私有规则。
