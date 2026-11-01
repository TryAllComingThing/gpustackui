# F0 存量工程基线

审计时间：2026-10-31T15:13:27Z。审计范围是当前工作区，不等同于干净 HEAD。审计只新增本报告文件，不修改生产源码、Theme、Showcase 组件或质量脚本。

## 身份与环境

| 项目 | 实际值 |
|---|---|
| HEAD | `d2e3309dd25d02ef99075a0d4dfa5799c0c1925` (`init`) |
| Node | `v22.22.0` |
| pnpm | `9.3.0` |
| Python | `3.11.9` |
| package manager | `pnpm@9.3.0`，见 `package.json:5` |
| installed @nuxt/ui | `4.12.0` |
| installed Vue | `3.5.44` |
| installed Vite | `6.4.5` |
| installed Zod | `3.25.76` |
| installed vue-router | `4.6.4` |
| installed Pinia | `3.0.4` |

依赖请求范围见 `package.json:22-39`。`package-lock.json` 与 `pnpm-lock.yaml` 同时存在；两者都声明 lockfile v3/依赖解析，但本审计没有执行安装或重新生成 lockfile。

工作树不是干净状态：`git status --short` 报告 23 项，包括 M2-04 Showcase、共享组件、主题适配、生成类型声明和 `.DS_Store` 变化。审计结论以当前工作树文件为证据，并在冲突报告中区分基线与未提交改动。

## 工程结构

- 生产入口：`src/main.ts:1-6`，创建 Vue App、初始化主题并挂载 `src/App.vue`。
- 当前生产页面：`src/App.vue:1-5`，只有 M1 主题冒烟页面；未发现生产路由或业务页面实现。
- 主题源：`src/theme/styles/themes/{standard,business,future}.css`，通过 `src/theme/styles/main.css:1-10` 汇总。
- 主题运行时：`src/theme/theme.manager.ts:3-20`，使用 `gpustack-theme` localStorage、`data-theme` 和三主题 ID。
- Showcase 入口：`showcase/index.html`、`showcase/main.ts:1-13`、`showcase/vite.config.ts:1-7`；独立端口 4174、memory router、local fixtures。
- 共享适配层：`src/components/common/DrpDataTable.vue`、`DrpSidebarNav.vue`、`DrpBreadcrumb.vue`；均包裹真实 Nuxt UI 组件。
- 质量入口：`quality/check_structure.py:1-11`、`quality/check_showcase_isolation.py:1-12`、`tests/visual/showcase.spec.ts:1-82`。

## 运行时和业务存量

- 路由：`src/app/router` 只有 `.gitkeep`；Showcase 使用 `showcase/main.ts:9-12` 的 memory router。生产路由状态：UNKNOWN/未实现。
- API 调用：`src/` 中未发现 `axios`、`fetch`、API URL、Authorization 或服务实现；`axios` 只是 `package.json:25` 依赖。后端契约：UNKNOWN/未落地。
- 认证与权限：`src/services/auth`、`src/stores` 只有占位目录/README；未发现登录、token、角色或权限实现。权限契约：UNKNOWN。
- 国际化：`src/locales/README.md` 仅为占位；未发现 `vue-i18n` 实例或 locale 资源。国际化覆盖：UNKNOWN。
- 业务模块：`src/modules/*` 只有 README/占位文件；没有可审计业务页面、状态机或 API 合同。
- Showcase 数据：`showcase/fixtures/resources.ts`、`showcase/fixtures/sample.ts`，仅本地 GPU Mock；未发现后端请求。

## 设计和主题基线

- 权威设计文档为 `DESIGN.md:1-168`，规定 standard/business/future、语义 Token、Header 面包屑位置、三主题和验收矩阵。
- 三个主题文件各有 42 个直接声明的 `--gp-*` 值；公共 `tokens.css:17-20` 声明 10 个黑白透明度值。三主题 L1/L2/L3 语义别名均在每个主题文件中存在。
- 主题切换与刷新恢复已有实现：`theme.manager.ts:6-18`。首屏同步脚本未实现，文档也将其列为可选措施；首次闪烁风险：OPEN。
- Showcase 展示完整颜色组、字号/间距/圆角基础 Token 和 `component-matrix.ts`；真实 UI 组件在 `showcase/App.vue:176-198`、`ComponentSection.vue:9-22`、`FormSection.vue:65-90`。

## F0 结论

当前仓库是“Vue 生产骨架 + 可运行的独立 M2 Showcase”，不是完整业务前端。Theme 和 Showcase 证据较完整；生产路由、业务模块、API、认证、权限、locale 和正式页面仍是 UNKNOWN/占位。F0 不给出迁移完成、业务等价或发布结论。
