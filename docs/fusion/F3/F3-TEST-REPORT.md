# F3 专项测试报告

总体状态：**F3-PASS**（SaaS visual-foundation scope；GPU runtime mapping explicitly excluded）。

## 环境

- OS：macOS Darwin arm64 (`Darwin 24.2.0`)
- Node：`v22.22.0`
- pnpm：`9.3.0`
- Python：`3.11.9`
- Playwright：`1.64.1`（package range `^1.50.0`）
- 浏览器：Chromium（Playwright bundled）
- 视口：1440×900；专项响应式视口 390×900；locale `zh-CN`；timezone `UTC`；light；deviceScaleFactor 1

## 实际命令与退出码

| 命令 | 退出码 | 实际结果 |
|---|---:|---|
| `pnpm validate:f2-tokens` | 0 | F2 Primitive、键集合、Semantic/Component 引用通过 |
| `pnpm validate:f3-tokens` | 0 | F3 Schema、Density selector、runtime aliases、namespace 和 z-index fallback 审计通过 |
| `pnpm validate:saas-visual-foundation` | 0 | SaaS Radius/Shadow/Motion/Icon/Layout/Z-index/DataViz source 与 Schema 通过 |
| `pnpm generate:saas-visual-foundation` | 0 | 从五主题 JSON 生成 SaaS-only visual foundation |
| `pnpm validate:design-contract` | 0 | 五主题来源 parity、registry 和契约通过 |
| `pnpm typecheck` | 0 | 生产源码类型检查通过 |
| `pnpm typecheck:showcase` | 0 | Showcase 类型检查通过 |
| `pnpm lint` | 0 | ESLint 通过 |
| `pnpm test:unit` | 0 | 3 files / 9 tests passed |
| `pnpm build` | 0 | 生产构建通过 |
| `pnpm build:showcase` | 0 | Showcase 构建通过；Nuxt UI chunk 约 455 kB |
| `pnpm check:showcase-isolation` | 0 | 生产产物无已知 Showcase 标记 |
| `pnpm test:e2e` | 0 | 4 tests passed：F3 专项、五主题×三密度、生产路由 2 项 |
| `pnpm test:showcase` | 0 | 2 tests passed |
| `pnpm exec playwright test tests/e2e/f3-specialized.e2e.ts` | 0 | 专项 Typography、持久化、几何和响应式 1 passed |
| `git diff --check` | 0 | 无空白错误 |

## 验证覆盖

- Token Schema：F2/F3 校验脚本实际执行通过。
- Typography：真实 `getComputedStyle` 验证 body、page title、line-height、numeric tabular 和 code family。
- Density：三档切换、`data-density`、localStorage reload 恢复；确认不会修改 `data-theme`。
- 组合矩阵：standard/business/future/sky/ocean × compact/standard/comfortable，共 15 组真实计算样式。
- Layout：Header 60px、Sidebar 200px、Header Breadcrumb；窄屏 390px 侧栏 fixed、主内容和 Breadcrumb 可见。
- Visual regression：15 张主题×密度截图和 2 张专项桌面/移动截图。

## 截图与报告

- 主题矩阵：`test-results/e2e-f3-third-round.e2e.ts--c8945-l-runtime-tokens-and-layout/screenshots/`，15 张。
- 专项截图：`test-results/e2e-f3-specialized.e2e.ts--c266a-ometry-and-responsive-shell/`，桌面和移动各 1 张。
- Playwright 最近结果：`test-results/.last-run.json` 为 `status=passed`、`failedTests=[]`。
- 来源审计：`docs/fusion/F3/F3-SOURCE-AUDIT.csv`。缺失值已补齐为 SaaS-only source；GPU runtime mapping 明确排除。

## 缺陷结论

本轮发现并关闭 F3-D-007：三个布局 z-index 引用此前没有定义。修复采用 CSS fallback，避免伪造 canonical z-index scale；新增视觉参数仍由 `F3-DEFECTS.csv` 标记为 `DEFERRED`。

F3 已可标记 PASS，但仅限 SaaS visual-foundation scope；GPU runtime mapping 不是本次验收范围。

## 永久豁免

axe-core、Firefox/WebKit、截图基线审批和人工 WCAG 评审未执行，状态为 **EXEMPT**，不计入 PASS。
