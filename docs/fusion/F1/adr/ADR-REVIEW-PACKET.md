# F1 ADR 评审包

本文把本轮实现证据集中到 ADR 评审入口。小张已代表设计、产品、架构和无障碍责任人于 2026-11-01 批准以下决策。批准设计决策不等同于所有实现和质量门禁完成。

| ADR | 评审材料 | 本轮证据 | 当前状态 |
|---|---|---|---|
| D01 | 双层 DESIGN.md、F1 冲突矩阵 | `DESIGN.md`、`DESIGN.md`、F1 CSV 结构检查 | APPROVED / 小张 / 2026-11-01 |
| D02/D03 | 五主题 ID 与映射 | `src/theme/theme.types.ts`、`theme.registry.ts`、`THEME-CONTRACT.md`、五主题 Playwright | APPROVED / 小张 / 2026-11-01 |
| D04/D05/D06 | Header、Sidebar、Breadcrumb | `AppShell.vue`、`AppBreadcrumb.vue`、无障碍 landmark/键盘测试 | APPROVED / 小张 / 2026-11-01 |
| D07/D08 | Typography、Density | `typography.json`、`density.json`、契约脚本检查 | APPROVED / 小张 / 2026-11-01 |
| D09 | `--gp-*` runtime namespace | 五主题 CSS parity、`validate_contracts.py`、生产构建/隔离检查 | APPROVED / 小张 / 2026-11-01 |
| D10 | 独立 Showcase | 独立 Vite 入口、fixtures、视觉测试、分包构建 | APPROVED / 小张 / 2026-11-01 |

## 批准范围说明

批准范围为设计决策、项目覆盖、冲突分类和延期策略。生产路由、density manager、runtime typography 映射、axe、Firefox、WebKit、截图和人工 WCAG 评审仍按验收矩阵单独跟踪，不因 ADR 批准自动标记完成。

## 自动化门禁结果

- `pnpm validate:design-contract`：0
- `pnpm test:unit`：0，4 tests passed
- `pnpm test:accessibility`：0，2 tests passed
- `pnpm test:showcase`：0，2 tests passed
- `pnpm build:showcase`：0，最大 JS chunk 约 455 kB，无 >500 kB/circular chunk 警告
