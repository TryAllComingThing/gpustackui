# GPUStack F3 第二轮实施记录

状态：**REVIEW**

本轮依据 F1 已批准 ADR-D04/D05/D06/D07/D08/D09 和 F2 Token Schema，接入独立 Density runtime 与基础视觉 Token。未修改业务逻辑、业务组件、路由契约或 Showcase 实现。

## 已实施

- `data-density="compact|standard|comfortable"` 作为密度唯一运行时选择器。
- `tokens.css` 增加三密度选择器，提供 `--gp-control-height-md`、`--gp-table-row-height-md`、`--gp-card-padding-md` 及现有变量覆盖。
- `density.manager.ts` 只负责校验、设置 `data-density` 和 localStorage，不再以内联样式覆盖 CSS 密度契约。
- `components.css` 的卡片、输入、弹窗、Popover 和表格基础值改用 Surface/Density Token。
- 保留 `--gp-*` 与旧兼容别名；未引入 `--ds-*`。
- Surface canvas/default/subtle/raised/overlay 使用已批准主题层派生别名。
- Motion/Icon 只补充已有值的别名；未冻结新的时长、Z-index、Icon family 或主题化 Radius/Shadow 数值。

## 正交性

`data-theme` 和 `data-density` 由两个独立属性控制。Theme manager 只写 `data-theme`，Density manager 只写 `data-density`；五主题 CSS 不包含密度选择器，三密度 CSS 不包含主题选择器。

## 修改文件

- `src/theme/density.manager.ts`
- `src/theme/styles/tokens.css`
- `src/theme/styles/components.css`
- `tests/unit/density-typography.spec.ts`
- `docs/fusion/F3/F3-VISUAL-AUDIT.csv`
- `docs/fusion/F3/F3-TOKEN-MAPPING.csv`
- `docs/fusion/F3/F3-ROUND2-REPORT.md`

## 风险与待决

1. SaaS 232px Sidebar 与 GPUStack 已批准 200px Sidebar 仍是项目覆盖关系，密度源文件保留上游值，runtime 使用 GPUStack 布局 Token。
2. 主题化 Radius、结构化 Shadow elevation、SaaS Motion 精确时长、Z-index 层级和 Icon family 尚未有批准项目值，均保持 `PENDING`。
3. 组件库中仍存在旧 `.ds-*` 兼容选择器；它们已指向 GPUStack Token，不在本轮删除，避免破坏旧页面。
4. DataViz 现有五个 `--gp-chart-*` 变量继续保留；六类图表色板没有批准的具体值，本轮不擅自扩展。

## 实际验证

- `pnpm validate:design-contract`：退出码 0
- `pnpm typecheck`：退出码 0
- `pnpm typecheck:showcase`：退出码 0
- `pnpm test:unit`：退出码 0，6 tests passed
- `pnpm build`：退出码 0
- `pnpm build:showcase`：退出码 0，最大 JS chunk 约 455 kB
- `pnpm test:e2e`：退出码 0，2 tests passed
- `pnpm test:showcase`：退出码 0，2 tests passed
- `pnpm check:showcase-isolation`：退出码 0
- `pnpm lint`：退出码 0
- `git diff --check`：退出码 0

本项目永久豁免 axe-core、Firefox/WebKit、截图和人工 WCAG 评审，本轮不执行这些检查。
