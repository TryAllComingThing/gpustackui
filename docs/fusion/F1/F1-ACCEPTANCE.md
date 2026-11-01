# F1 验收清单

总体状态：**PASS**

验收规则：关键 ADR 已由小张于 2026-11-01 批准；本次明确豁免 axe-core、Firefox/WebKit、截图和人工 WCAG 评审。F1 只判断已批准设计资产、生产壳/路由、Token runtime、组件矩阵和已执行自动化证据。

| 编号 | 验收项 | 证据 | 状态 | 阻断原因/后续动作 |
|---|---|---|---|---|
| F1-01 | 双层 DESIGN.md 已建立 | `DESIGN.md`、`DESIGN.md`、`ADR-REVIEW-PACKET.md` | PASS | ADR-D01 已批准并有证据 |
| F1-02 | 权威层级 D01 | `docs/fusion/F1/adr/ADR-INDEX.md:5-20` | PASS | 小张于 2026-11-01 批准 |
| F1-03 | 主题 ID D02/D03 | `DESIGN.md:20-32`；`src/theme/theme.types.ts`；`src/theme/theme.registry.ts` | PASS | 五个 runtime ID 和映射已实现并测试 |
| F1-04 | A2/B/C/D/E 映射 | `F1-CONFLICT-MATRIX.csv:2-6`；`src/theme/styles/themes/*.css` | PASS | 五套值映射和 parity 已验证 |
| F1-05 | Header 60px D04 | `src/theme/styles/tokens.css`；`src/components/layout/AppShell.vue`；`tests/e2e/production-routes.e2e.ts` | PASS | Header runtime 和生产 Shell 已验证 |
| F1-06 | Sidebar 200/64 D05 | `src/theme/styles/tokens.css`；`src/components/layout/AppSidebarNav.vue`；生产 E2E | PASS | 折叠、嵌套和导航路径已验证 |
| F1-07 | Breadcrumb Header D06 | `src/components/layout/AppShell.vue`；`src/components/common/AppBreadcrumb.vue`；生产 E2E | PASS | 动态路由面包屑和唯一 Header 位置已验证 |
| F1-08 | Typography D07 | `typography.json`；`typography.manager.ts`；单元测试 | PASS | 九级语义已映射到 `--gp-type-*` |
| F1-09 | Density D08 | `density.json`；`density.manager.ts`；单元/E2E | PASS | 三密度独立持久化和刷新恢复已验证 |
| F1-10 | CSS Token D09 | `src/theme/styles/main.css`；`tokens.css`；契约脚本 | PASS | `--gp-*` namespace 和 parity 已验证 |
| F1-11 | Showcase D10 | Showcase 入口、构建、视觉测试、隔离检查 | PASS | 独立入口和生产隔离已验证 |
| F1-12 | 组件/状态映射 | `showcase/component-matrix.ts`；SaaS `COMPONENT_MATRIX.csv` | PASS | 23 类 SaaS 组件加 1 个 GPUStack Form 适配条目，共 24 条状态契约已登记；未渲染条目明确为契约目标 |
| F1-13 | 生产 Shell | 路由、模块页面、AppShell、Sidebar、生产 E2E | PASS | 所有注册生产路由和完整导航已验证 |
| F1-14 | A11y/浏览器门禁 | Showcase 语义/键盘测试、范围豁免记录 | PASS | 本次明确不执行 axe、Firefox、WebKit、截图和人工 WCAG 评审 |
| F1-15 | 原规范可追溯备份 | `docs/fusion/F1/archive/` | PASS | 原始规范备份完整 |

## 验收结论

F1 当前为 **F1-PASS**。设计 ADR 已批准；五主题 Token、生产路由、业务模块展示入口、完整导航、Density manager、Typography runtime 映射、23 类 SaaS 组件加 1 个 GPUStack Form 适配条目状态矩阵、单元测试、生产 E2E、Showcase 构建和隔离检查均有真实证据。真实业务 API/权限契约属于迁移清单后续范围，不作为 F1 设计冻结阻断。axe-core、Firefox/WebKit、截图和人工 WCAG 评审按项目范围永久豁免，不执行也不宣称通过。
