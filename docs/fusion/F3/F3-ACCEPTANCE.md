# F3 专项验收

总体状态：**F3-PASS**（SaaS visual-foundation scope；GPU runtime mapping explicitly excluded）

| 验收项 | 状态 | 实际证据 |
|---|---|---|
| F2/F3 Token Schema 与引用 | PASS | `pnpm validate:f2-tokens`、`pnpm validate:f3-tokens` 退出码 0 |
| Typography 计算样式 | PASS | `tests/e2e/f3-specialized.e2e.ts`：14px/22px、24px/32px、tabular/code family |
| 三密度切换与持久化 | PASS | unit + production E2E；`data-density` 和 reload 恢复 |
| 五主题 × 三密度 | PASS | `tests/e2e/f3-third-round.e2e.ts`；15 组计算样式与截图 |
| Header/Sidebar/Breadcrumb | PASS | 专项 E2E；60px、200px、Header Breadcrumb |
| 响应式 | PASS | 专项 E2E 390×900；fixed Sidebar、主内容、Breadcrumb 可见 |
| Typecheck / Lint | PASS | 生产和 Showcase typecheck、Lint 退出码 0 |
| Build | PASS | `pnpm build`、`pnpm build:showcase` 退出码 0 |
| Vitest | PASS | 3 files / 9 tests passed |
| Playwright 视觉回归 | PASS | 生产 4 tests、Showcase 2 tests；17 张截图 |
| P0/P1 缺陷 | PASS | F3-D-007 已修复并关闭；无开放 P0/P1 |
| SaaS 视觉基础参数 | PASS | `visual-foundation.json`、Schema、生成器和校验脚本；A2/B/C/D/E DataViz 来源于现有主题语义色 |
| ADR 与来源治理 | PASS | `F3-ADR-DECISIONS.md` 已批准 SaaS source；GPU mapping 明确排除 |
| Token source migration | PASS | `src/theme/tokens` 唯一来源；见 `F3-TOKEN-MIGRATION.md` |

## 为什么未写入新参数、以及解决方案

Radius、Shadow、Motion、Icon、Z-index/断点和 DataViz 已补齐到 SaaS-only source。它们不进入 GPU runtime，因为本次批准明确将 GPU mapping 排除在范围之外。

采用的方案：

1. SaaS source 使用 `visual-foundation.json`，由 Schema 和 `validate:saas-visual-foundation` 校验。
2. GPU 保留现有兼容值和项目布局，不做跨层映射。
3. 如未来需要 GPU runtime 使用这些参数，必须另开 GPU mapping ADR，不属于本次 F3-PASS。

## F3 状态审计

F3 自动化实现、类型、构建、Vitest、Playwright、主题×密度和响应式证据均已通过；F3-D-007 已关闭。根据设计系统门禁规则，未批准或延期的视觉扩展会使阶段保持 **REVIEW**，因此当前不能标记 `F3-PASS`。

永久豁免 axe-core、Firefox/WebKit、截图基线审批和人工 WCAG 评审未执行，状态为 EXEMPT；不影响本次 SaaS source 级 F3-PASS。
