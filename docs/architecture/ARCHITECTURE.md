# Vue 3 SaaS Framework Architecture

本文件描述当前真实实现与落地边界，不替代根 `DESIGN.md`。

## 1. 架构总览

```text
index.html
  └─ src/main.ts
      ├─ initTheme / initDensity / initAppearance / initTypography / initLayout / initLocale
      ├─ src/config/product.ts (brand + base path + demo/SSO flags)
      ├─ vue-i18n
      ├─ vue-router
      ├─ @nuxt/ui/vue-plugin
      └─ src/App.vue
          └─ UApp (Provider: Tooltip / Overlay / Toast)
              └─ AppShell
                  ├─ Header: Brand / UBreadcrumb / actions
                  ├─ Sidebar: USidebarNav
                  └─ Main: RouterView
                      └─ src/modules/*/pages/*.vue
                          ├─ src/modules/resources/examples/gpustack (optional example)
                          ├─ src/api/<domain> (backend contract)
                          ├─ module-private components/composables/types
                          └─ Nuxt UI primitives + thin U* adapters + patterns

showcase/index.html → showcase/main.ts → showcase/App.vue
  └─ same src/components + src/theme + managers
  └─ local fixtures only; independent Vite entry; not in production routes/bundle
```

运行时只存在一套 `--gp-*` 设计 Token 管线。生产与 Showcase 共用组件、Theme manager、Density manager、Appearance manager、Typography manager 和 Layout manager。

## 2. 分层职责

| 层 | 位置 | 职责 | 禁止事项 |
|---|---|---|---|
| Entry/Bootstrap | `index.html`、`src/main.ts`、`showcase/main.ts` | 创建 Vue 应用、注册 vue-i18n/Router/Nuxt UI、初始化五个 manager、加载统一 CSS 入口。 | 不在入口写业务状态或页面特例。 |
| App Shell | `src/App.vue`、`src/components/layout/AppShell.vue` | 提供 `UApp` Provider、Header、Breadcrumb、Sidebar、Main 的稳定布局和移动端折叠行为。 | 不在页面重复渲染 Breadcrumb；不绕过 Provider。 |
| Product Config | `src/config/product.ts` | 从 `VITE_APP_NAME`、`VITE_APP_BASE`、示例开关和 `VITE_SSO_LOGIN_URL` 生成统一产品配置；壳层、登录、路由标题与面包屑消费同一配置。 | 不保存密钥；不在壳层硬编码品牌；示例开关不得改变认证或 API 语义。 |
| API Contracts | `src/api/<domain>/` | 领域端点、响应 Schema 与契约类型；页面通过 API 层消费后端。 | 不导入 `src/modules` 或 `src/components`；不虚构未定义端点。 |
| Shared Components | `src/components/common/`、`src/components/feedback/`、`src/components/layout/` | Nuxt UI 薄适配、统一反馈状态、应用壳层。 | 不做纯 prop 透传；不复制 Nuxt UI 原语；不依赖业务模块。 |
| Patterns | `src/components/patterns/` | 跨页面组合能力：筛选、远程加载、表格操作、复杂表单。 | 不承载页面私有业务规则。 |
| Modules | `src/modules/` | 按业务域组织页面、`routes.ts`、公共 `index.ts`、私有组件、私有 composable 和类型；GPUStack 专用 GPU 页面位于 `resources/examples/gpustack/`。 | 不跨模块导入私有实现；不修改后端契约；公共 UI 不上移则不得跨模块复用；示例关闭后不得注册其路由。 |
| Theme Runtime | `src/theme/` | Theme、Density、Appearance、Typography、Layout 的初始化、持久化、fallback 和 `data-*` 属性。 | 主题或外观切换不得改变表单值、权限、滚动位置或后端语义。 |
| Token Source | `src/theme/tokens/` | Primitive、semantic mapping、density、appearance、typography、visual foundation。 | 不出现第二套 runtime namespace。 |
| Generated Styles | `src/theme/styles/themes/*.css` | `scripts/generate_theme_css.py` 从主题与 appearance JSON 可重复生成。 | 不手动维护生成文件为独立事实来源。 |
| Showcase | `showcase/` | 真实组件、Token、状态矩阵和本地 fixtures 的独立预览入口。 | 不进入生产路由或生产 bundle；不调用后端。 |

## 3. 组件策略

1. 默认直接复用 Nuxt UI 4 原语：`UButton`、`UInput`、`UForm`、`UModal`、`UDrawer`、`UTable` 等。
2. 只为跨页面状态、递归装饰、无障碍契约、稳定 DOM 契约或项目布局建立薄 `U*` 适配器。
3. 当前 adapter：
   - `USidebarNav`：合并 `activeKey`/`openItems`，递归装饰当前项，包装 `onSelect`，固定 `gp-sidebar-nav` 契约。
         - `UDataTable`：组件编排表格模板与服务端查询/错误/空状态；排序、分页和行选择状态由 `useDataTable` 与 `dataTableState` 辅助单元承载。`DataTablePattern` 对远程搜索/筛选做防抖合并，并重置页码。
   - `UBreadcrumb`：统一 `aria-label`、`data-testid` 和 `gp-breadcrumb` class。
4. `UBreadcrumb` 与 Nuxt UI 原语同名。适配器内部必须显式导入 `NuxtBreadcrumb` 别名，避免组件自递归。
5. 模块公共 UI 只在两个以上模块复用或承载跨页面契约时上移到 `src/components/`；模块私有组件留在 `src/modules/<domain>/components/`。
6. 应用路由只从模块公共入口汇总，不直接引用模块内部 `routes.ts`。

## 4. 主题、Density、Appearance、Typography 与 Layout

- `theme.manager.ts` 写入 `document.documentElement.dataset.theme`，持久化键为 `vue-saas-theme`。
- `density.manager.ts` 写入 `data-density`，持久化键为 `vue-saas-density`；Density 与 Theme 正交。
- `appearance.manager.ts` 接受 `system`、`light`、`dark`，写入 `data-appearance`、`data-appearance-preference`、`color-scheme` 与 `dark` class，持久化键为 `vue-saas-appearance`；Appearance 与 Theme ID 正交。
- `typography.manager.ts` 将 `typography.json` 写入 `--gp-type-*`，并标记 `data-typography="saas-v1"`。
- `layout.manager.ts` 只接受正像素值，写入 `--gp-header-height`、`--gp-sidebar-width`、`--gp-sidebar-collapsed-width` 和 `data-breadcrumb-placement`。
- `locale.manager.ts` 写入 `documentElement.lang` 与 `dir`，持久化键为 `vue-saas-locale`。
- 旧偏好键 `gpustack-theme`、`gpustack-density`、`gpustack-locale` 由 `src/utils/preferences.ts` 一次性迁移到新键。
- 五主题源文件使用公开主题 ID：`themes/standard.json`、`business.json`、`future.json`、`sky.json`、`ocean.json`，五者均为公开一等主题。

Token 层级：

1. Primitive：主题 JSON、appearance JSON、typography JSON、density JSON；
2. Semantic：生成的主题/外观 CSS 与 `tokens.css` 中的 `--gp-*`；
3. Component：`components.css`、`layout.css` 和 `nuxt-ui.bridge.css`；
4. Compatibility：V2.x/V2.0 alias，单向指向 canonical `--gp-*`。

## 5. 设计思路

- **Nuxt UI 优先**：减少重复组件和视觉漂移；框架只补跨页面契约。
- **单一命名空间**：业务只依赖 `--gp-*`，Nuxt UI 通过 bridge 消费同一来源。
- **正交运行时**：Theme、Density、Appearance、Typography、Layout 各自负责一个 `data-*` 或变量组，互不覆盖。
- **可重复生成**：主题色由 JSON 生成 CSS，禁止手工形成第二事实来源。
- **生产/Showcase 同源**：共享组件和 manager，只隔离入口、fixtures 与构建产物。
- **兼容优先**：旧 API 保留为 alias；新代码只使用 canonical 名称。

## 6. 设计理念

| 理念 | 落地约束 |
|---|---|
| 一致性 | 所有页面使用同一 Shell、Token、组件状态与 Nuxt UI bridge。 |
| 可访问性 | 语义 landmark、可访问名称、键盘焦点、Escape、焦点恢复、状态播报不可省略。 |
| 正交性 | Theme/Density/Appearance/Typography/Layout 独立存储和独立应用。 |
| 兼容性 | 兼容 alias 单向指向 canonical；破坏性 API 变更通过 ADR 和迁移策略处理。 |
| 最小适配 | 纯 prop 透传不得新建 `U*`；跨页面能力才允许 adapter。 |
| 可维护性 | 页面私有逻辑留在模块内，公共层只承载真实跨模块需求。 |

## 7. 从模板扩展业务

1. 通过 `.env` 配置产品或保持默认示例。
2. 用 `npm run create:module -- <name>` 创建模块骨架。
3. 在 `src/api/<domain>/` 接入后端契约与 Schema。
4. 在模块页面复用 `src/components`、`src/composables` 和 `--gp-*` Token。
5. 在模块 `routes.ts` 补充标题、面包屑、导航和权限元数据。
6. 在 `src/locales` 同步中英文文案。
7. 在 Showcase 增加必要的组件或 Pattern 示例。
8. 运行受影响的类型检查、单元测试、E2E、无障碍测试和构建。

## 8. 当前实现

- 旧组件前缀已统一为 `U*`；`auto-imports.d.ts` 与 `components.d.ts` 由工具链按需重新生成，不作为源码。
- 五主题、三密度、三外观和 Typography 由 JSON/CSS 源驱动，运行时不维护第二套值。
- 认证/权限采用 HttpOnly Cookie + `is_admin`；前端已实现服务端会话确认、`unknown/checking/authenticated/anonymous/unavailable` 状态机、登录/回跳/退出、统一 `401/403` 和业务路由保护。前端守卫不是安全边界，后端必须独立授权。
- GPU 设备 API 已按 `GET /v2/gpu-devices` 与分页响应定义；示例页面仍使用本地 fixture。
- 产品名称、子路径、示例模块和 SSO 入口集中在 `src/config/product.ts`。资源、模型、部署和服务 fixtures 仅在 `VITE_ENABLE_DEMO_MODULES=true` 时注册；GPUStack 专用 GPU 页面还需 `VITE_ENABLE_GPUSTACK_EXAMPLE=true`。
- 登录页在 `/auth/config` 报告 SAML/OIDC 可用时显示 SSO 入口；`/account/password` 使用真实修改密码契约，并在成功后尝试服务端登出。
- 当前有效来源是根 `DESIGN.md`、本文件、`docs/design/` 与真实源码。
