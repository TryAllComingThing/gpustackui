# GPUStack Vue 3 SaaS Framework Architecture

状态：`APPROVED / PENDING CLEAN CANDIDATE COMMIT`；基线：`0.2.0-internal-template-baseline`；发布门禁：`BLOCKED`。本文件描述当前真实实现与落地边界，不替代根 `DESIGN.md`。

## 1. 架构总览

```text
index.html
  └─ src/main.ts
      ├─ initTheme / initDensity / initTypography / initLayout / initLocale
      ├─ vue-i18n
      ├─ vue-router
      ├─ @nuxt/ui/vue-plugin
      └─ src/App.vue
          └─ UApp (Provider：Tooltip / Overlay / Toast)
              └─ AppShell
                  ├─ Header：Brand / UBreadcrumb / actions
                  ├─ Sidebar：USidebarNav
                  └─ Main：RouterView
                      └─ src/modules/*/pages/*.vue
                          ├─ src/api/<domain> (backend contract)
                          ├─ module-private components/composables/types
                          └─ Nuxt UI primitives + thin U* adapters + patterns

showcase/index.html → showcase/main.ts → showcase/App.vue
  └─ same src/components + src/theme + managers
  └─ local fixtures only; independent Vite entry; not in production routes/bundle
```

运行时只存在一套 `--gp-*` 设计 Token 管线。生产与 Showcase 共用组件、Theme manager、Density manager、Typography manager、Layout manager 和 Showcase 之外的构建边界。

## 2. 分层职责

| 层 | 位置 | 职责 | 禁止事项 |
|---|---|---|---|
| Entry/Bootstrap | `index.html`、`src/main.ts`、`showcase/main.ts` | 创建 Vue 应用、注册 vue-i18n/Router/Nuxt UI、初始化五个 manager、加载统一 CSS 入口。 | 不在入口写业务状态或页面特例。 |
| App Shell | `src/App.vue`、`src/components/layout/AppShell.vue` | 提供 `UApp` Provider、Header、Breadcrumb、Sidebar、Main 的稳定布局和移动端折叠行为。 | 不在页面重复渲染 Breadcrumb；不绕过 Provider。 |
| API Contracts | `src/api/<domain>/` | 领域端点、响应 Schema 与契约类型；页面通过 API 层消费后端。 | 不导入 `src/modules` 或 `src/components`；不虚构未冻结端点。 |
| Shared Components | `src/components/common/`、`src/components/feedback/`、`src/components/layout/` | Nuxt UI 薄适配、统一反馈状态、应用壳层。 | 不做纯 prop 透传；不复制 Nuxt UI 原语；不依赖业务模块。 |
| Patterns | `src/components/patterns/` | 跨页面组合能力：筛选、远程加载、表格操作、复杂表单。 | 不承载页面私有业务规则。 |
| Modules | `src/modules/` | 按业务域组织页面、`routes.ts`、公共 `index.ts`、私有组件、私有 composable 和类型。 | 不跨模块导入私有实现；不修改后端契约；公共 UI 不上移则不得跨模块复用。 |
| Theme Runtime | `src/theme/` | Theme、Density、Typography、Layout 的初始化、持久化、fallback 和 `data-*` 属性。 | 主题切换不得改变表单值、权限、滚动位置或后端语义。 |
| Token Source | `src/theme/tokens/` | Primitive、semantic mapping、density、typography、visual foundation。 | 不出现第二套 runtime namespace。 |
| Generated Styles | `src/theme/styles/themes/*.css` | `scripts/generate_theme_css.py` 从主题 JSON 可重复生成。 | 不手动维护生成文件为独立事实来源。 |
| Showcase | `showcase/` | 真实组件、Token、状态矩阵和本地 fixtures 的开发验收。 | 不进入生产路由或生产 bundle；不调用后端。 |
| Quality | `scripts/quality_check.py`、`docs/quality/` | 执行可复现检查并保存命令、退出码、环境和证据。 | 未执行或失败不得写成 PASS。 |

## 3. 组件策略

1. 默认直接复用 Nuxt UI 4 原语：`UButton`、`UInput`、`UForm`、`UModal`、`UDrawer`、`UTable` 等。
2. 只为跨页面状态、递归装饰、无障碍契约、稳定 DOM 契约或项目布局建立薄 `U*` 适配器。
3. 当前 adapter：
   - `USidebarNav`：合并 `activeKey`/`openItems`，递归装饰当前项，包装 `onSelect`，固定 `gp-sidebar-nav` 契约。
   - `UDataTable`：统一排序、分页、行选择、服务端查询、错误/空状态和可访问播报。
   - `UBreadcrumb`：统一 `aria-label`、`data-testid` 和 `gp-breadcrumb` class。
4. `UBreadcrumb` 与 Nuxt UI 原语同名。适配器内部必须显式导入原语并命名为 `NuxtBreadcrumb`，模板绑定该别名；禁止在适配器模板里裸写 `<UBreadcrumb>`，否则会自递归。
5. `UApp` 是运行时 Provider 前置条件。折叠 Sidebar 的 tooltip、overlay 和 toast 不能在没有 `UApp` 的树中工作。
6. 跨模块公共 UI 统一上移到 `src/components/`；模块私有 UI 保留在 `src/modules/<domain>/components/`。跨模块公共 UI 不得反向依赖业务模块。
7. 领域 API 与响应 Schema 统一放在 `src/api/<domain>/`；`src/services/http/` 只保留传输、错误归一化和 `Result`。
8. 每个模块通过 `src/modules/<domain>/index.ts` 暴露公共入口；应用路由只从模块公共入口汇总，不直接引用模块内部 `routes.ts`。

## 4. 主题、Density、Typography 与 Layout

- `theme.manager.ts` 写入 `document.documentElement.dataset.theme`，持久化键为 `gpustack-theme`。
- `density.manager.ts` 写入 `data-density`，持久化键为 `gpustack-density`；Density 与 Theme 正交。
- `typography.manager.ts` 将 `typography.json` 写入 `--gp-type-*`，并标记 `data-typography="saas-v1"`。
- `layout.manager.ts` 只接受正像素值，写入 `--gp-header-height`、`--gp-sidebar-width`、`--gp-sidebar-collapsed-width` 和 `data-breadcrumb-placement`。
- 五主题映射：`standard=E`、`business=A2`、`future=D`、`sky=B`、`ocean=C`，五者均为公开一等主题。

Token 层级：

1. Primitive：主题 JSON、typography JSON、density JSON；
2. Semantic：生成的主题 CSS 与 `tokens.css` 中的 `--gp-*`；
3. Component：`components.css`、`layout.css` 和 `nuxt-ui.bridge.css`；
4. Compatibility：V2.x/V2.0 alias，单向指向 canonical `--gp-*`。

## 5. 设计思路

- **Nuxt UI 优先**：减少重复组件和视觉漂移；框架只补跨页面契约。
- **单一命名空间**：业务只依赖 `--gp-*`，Nuxt UI 通过 bridge 消费同一来源。
- **正交运行时**：Theme、Density、Typography、Layout 各自负责一个 `data-*` 或变量组，互不覆盖。
- **可重复生成**：主题色由 JSON 生成 CSS，禁止手工形成第二事实来源。
- **生产/Showcase 同源**：共享组件和 manager，只隔离入口、fixtures 与构建产物。
- **兼容可逆**：旧 API 保留为 alias，推荐最佳值先进入审批，不直接破坏已发布消费方。

## 6. 设计理念

| 理念 | 落地约束 |
|---|---|
| 一致性 | 所有页面使用同一 Shell、Token、组件状态与 Nuxt UI bridge。 |
| 可访问性 | 语义 landmark、可访问名称、键盘焦点、Escape、焦点恢复、状态播报不可省略。 |
| 正交性 | Theme/Density/Typography/Layout 独立存储和独立应用。 |
| 可逆性 | 兼容 alias 与布局配置有明确回滚路径；不删除有效证据和历史基线。 |
| 证据驱动 | 只有真实退出码和报告才能支撑 PASS；缺失证据保持 BLOCKED。 |
| 最小适配 | 纯 prop 透传不得新建 `U*`；跨页面能力才允许 adapter。 |

## 7. 落地路径与落地方案

完整 Phase、输入/输出、门禁、负责人角色和回滚按下述摘要执行：

1. **Phase 0 基线审计**：确认工作树、权威文档、真实入口、构建命令和缺失证据。
2. **Phase 1 命名与组件收敛**：清零旧组件前缀，统一 `U*` adapter，处理 `UBreadcrumb` 同名冲突。
3. **Phase 2 Token/主题**：收敛 `--gp-*`、生成五主题、登记兼容 API；推荐值已于 2026-11-03 获批并落地。
4. **Phase 3 页面迁移**：逐页冻结 API/权限/异步状态，只替换壳层与视觉。
5. **Phase 4 Showcase 与质量门禁**：补齐测试/校验脚本，执行真实构建与浏览器证据。
6. **Phase 5 发布**：人工批准 + PASS gate + 回滚演练；当前不得发布。

## 8. 当前状态与未决项

- 旧组件前缀已全部改为 `U*`，源码引用已扫描清零；`components.d.ts` 由构建重新生成。
- 兼容 API 的最佳值已获人工批准并落地，详见 `docs/design/TOKEN-MAPPING.md`；五主题与三密度浏览器复验通过。
- 认证/权限契约已按 GPUStack 2.x 冻结为 HttpOnly Cookie + `is_admin`；路由保护保持 opt-in，业务路由尚未启用元数据。详见 `docs/architecture/AUTH-AND-PERMISSIONS.md`。
- GPU 设备 API 已按 `GET /v2/gpu-devices` 与分页响应冻结，页面仍使用本地 fixture，等待独立接入验收。详见 `docs/architecture/API-CONTRACT.md`。
- 当前有效来源是根 `DESIGN.md`、本文件、`docs/design/`、`docs/quality/` 与真实源码。
- 0.2.0 基线的消费形态已确定为复制模板；根包 `package.json` 保持 `private: true`，无 `exports`/`peerDependencies`/`files`/库构建脚本。可安装 npm 包形态 `DEFERRED`，未经新决策不得对外宣称可安装复用或提供升级承诺。
- 发布门禁要求干净候选版本、统一质量检查通过和候选版本对应的人工批准；未满足时保持 `BLOCKED`。

框架全景：架构见本文件；设计思路与设计理念见本文第 5-6 节及 `docs/design/FRAMEWORK-GUIDE.md`；门禁见 `docs/quality/QUALITY-GATES.md`。

