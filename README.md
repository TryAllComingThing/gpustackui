# Vue 3 SaaS Frontend Framework

面向后台管理与 SaaS 应用的通用 Vue 3 + TypeScript 前端框架。项目以仓库模板方式复用，内置应用壳、路由与导航、主题系统、组件适配层、API 契约层、国际化、Showcase 和 AI 编码上下文。

## 复用边界

- 本仓库是可直接复制、Fork 或作为新项目起点的模板仓库，不作为 npm 包发布；`package.json` 保持 `private: true`。
- 产品接入方负责配置真实后端、认证方式、部署路径和业务模块；框架只提供前端边界、通用 UI、运行时和契约骨架。
- 示例业务模块默认关闭；需要演示时可显式设置 `VITE_ENABLE_DEMO_MODULES=true`，但不得把 fixtures 当作真实 API。
- AI 编码上下文、设计规范和架构文档随源码一起复用，避免在新项目中重新建立平行主题、组件或 Token 体系。

## 技术栈

- Vue 3 + TypeScript + Vite
- Nuxt UI 4
- Vue Router + Pinia + vue-i18n
- Zod + Axios
- Vitest + Playwright

## 快速开始

```bash
npm install
npm run dev
```

常用命令：

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动生产应用开发服务器 |
| `npm run dev:showcase` | 启动独立 Showcase |
| `npm run typecheck` | 生产源码类型检查 |
| `npm run typecheck:showcase` | Showcase 类型检查 |
| `npm run lint` | ESLint |
| `npm run test:unit` | Vitest 单元与集成测试 |
| `npm run test:e2e` | Playwright 生产 E2E |
| `npm run test:showcase-smoke` | Showcase 浏览器测试 |
| `npm run test:accessibility` | Showcase 与生产页面无障碍测试 |
| `npm run build` | 类型检查并构建生产包 |
| `npm run build:showcase` | 构建独立 Showcase |
| `npm run reuse:search -- <关键词>` | 搜索可复用组件、Composable、Utils、Service 与模块 |
| `npm run create:module -- <name>` | 创建业务模块骨架 |

## 目录结构

```text
src/
  app/          路由、导航与应用级页面
  api/          按领域组织的后端契约与 Schema
  components/   跨模块公共组件、反馈状态、布局与 Pattern
  composables/  通用 Vue 组合函数
  config/       产品名称与可选示例开关
  modules/      按业务域组织的页面、路由与模块私有实现
  services/     HTTP、认证、会话与错误归一化
  stores/       跨模块 Pinia 状态
  theme/        Token 源、生成主题 CSS 与 Theme/Density/Appearance 等 runtime manager
  locales/      中英文资源与 locale manager
  utils/        无业务副作用的工具函数
showcase/       独立组件与主题预览入口
docs/           架构、设计、AI 工作流与任务模板
tests/          单元、集成、E2E、视觉与无障碍测试
planning/       PRD、Spec、技术设计与任务清单模板
```

## 应用架构

`src/main.ts` 创建 Vue 应用，初始化 Theme、Density、Appearance、Typography、Layout、Locale，注册 Pinia、Router、vue-i18n 和 Nuxt UI。`src/App.vue` 在 `UApp` Provider 内通过 `AppShell` 组织 Header、Breadcrumb、Sidebar 与 Main。

模块通过 `routes.ts` 注册路由，再由 `src/app/router/routes.ts` 汇总；导航由路由 `meta.nav` 派生。模块公共能力通过 `index.ts` 暴露，跨模块页面不得直接引用模块私有文件。

## 设计系统

- 唯一设计规范：`DESIGN.md`
- Token 源：`src/theme/tokens/`
- 生成主题：`src/theme/styles/themes/*.css`
- 运行时变量：`--gp-*`
- 一等主题：`standard`、`business`、`future`、`sky`、`ocean`
- 密度：`compact`、`standard`、`comfortable`
- 外观：`system`、`light`、`dark`

主题、Density、Appearance、Locale 正交，切换主题或深浅外观不会重置表单、权限或业务状态。Appearance 写入 `data-appearance`、`data-appearance-preference`、`color-scheme` 和兼容 Nuxt UI 的 `dark` class；它不改变主题 ID。Nuxt UI 通过 `nuxt-ui.bridge.css` 消费同一套 `--gp-*` 变量。修改主题颜色时先改 Token JSON，再运行：

```bash
npm run generate:theme-css
npm run check:theme-css
npm run check:tokens
```

## 新增业务模块

```bash
npm run create:module -- orders
```

生成器会创建 `src/modules/orders/`、注册路由、补充中英文 key，并按参数创建 API 占位或单元测试。生成后按以下顺序调整：

1. 接入真实 API 契约到 `src/api/orders/`；
2. 在 `pages/` 实现页面，复用现有 `U*`、Pattern 和反馈组件；
3. 在 `routes.ts` 补充标题、面包屑、导航和权限元数据；
4. 在 `src/locales` 同步文案；
5. 运行类型检查、单元测试与受影响 E2E。

## Showcase

Showcase 是独立 Vite 入口，使用与生产相同的 `src/components`、`src/theme` 和 manager，只使用本地 fixtures。它不会进入生产路由或生产包，并提供五主题 × 浅色/深色外观的切换验证。

```bash
npm run dev:showcase
npm run build:showcase
```

## 环境变量

参考 `.env.example`：

- `VITE_API_BASE_URL`：业务 API 基址，默认 `/v2`
- `VITE_AUTH_BASE_URL`：认证 API 基址，默认空
- `VITE_APP_NAME`：产品显示名称，默认 `Vue SaaS Framework`
- `VITE_APP_BASE`：部署子路径，例如 `/console/`；非法值回退 `/`
- `VITE_ENABLE_DEMO_MODULES`：是否注册资源、模型、部署和服务 fixtures 示例，默认关闭
- `VITE_ENABLE_GPUSTACK_EXAMPLE`：是否注册可选 GPUStack 示例，默认关闭；需同时启用 `VITE_ENABLE_DEMO_MODULES`
- `VITE_SSO_LOGIN_URL`：后端报告 SAML/OIDC 可用时显示的 SSO 入口；仅接受站内绝对路径或 HTTPS URL
- `VITE_CSRF_*`：CSRF Cookie/Header 配置
- `VITE_TRUSTED_LOGOUT_ORIGINS`：可信 SSO 退出 origin 白名单

## AI 编码上下文

AI 任务按以下顺序读取：

1. `AGENTS.md`
2. `DESIGN.md`
3. `docs/ai/CONTEXT-MAP.md`
4. `docs/ai/CODEX-WORKFLOW.md`
5. `docs/ai/TASK-CONTRACT.md` 与 `docs/ai/TASK-LEVELS.md`
6. 相关 Skill、架构文档与真实源码

任务规划模板位于 `planning/_template/`。
