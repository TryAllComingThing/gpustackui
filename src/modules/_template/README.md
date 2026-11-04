# 模块模板

复制本目录结构新增业务域模块，禁止跨模块导入私有实现。

约定：
- 页面放在 `src/modules/<域>/pages/`，根节点带 `data-testid="production-<域>"`。
- 每个模块提供 `routes.ts`，由 `src/app/router/routes.ts` 汇总；导航从路由 `meta.nav` 派生。
- 每个模块提供 `index.ts` 公共出口；应用只从公共出口导入，不直接引用模块内部文件。
- 后端契约放在 `src/api/<域>/`，模块不直接拼装 URL。
- 跨模块公共组件放在 `src/components/`；模块私有组件放在 `src/modules/<域>/components/`。
- 模块私有组合逻辑放在 `src/modules/<域>/composables/`，跨域逻辑才上移到 `src/composables/`。
- 文案使用 i18n key，注册到 `src/locales/zh-CN.ts` 与 `src/locales/en-US.ts`。
- 只消费 `--gp-*`、薄 `U*` adapter 与 Pattern，不在共享层写业务私有规则。
