# F3 视觉基础基线审计

状态：**REVIEW**

唯一设计权威为根目录 `DESIGN.md`。主题原始值和 F2 生成链来自 `src/theme/tokens/` 与 `scripts/generate_theme_css.py`。本轮不引入 GPUStack Profile，不修改业务逻辑，不重构 Nuxt UI 原语。

## 审计结论

| 领域 | 真实来源/实现 | 当前结论 | F3 处理状态 |
|---|---|---|---|
| Typography | `src/theme/tokens/typography.json`、`src/theme/typography.manager.ts`、`src/theme/styles/typography.css` | 九级语义已映射；数字和代码语义存在 | ACTIVE；补充首屏 `--gp-type-numeric-variant`、`--gp-type-code-family` 回退 |
| Spacing / Density | `src/theme/tokens/density.json`、`src/theme/density.manager.ts`、`src/theme/styles/tokens.css` | 4px 基准和三密度变量已实现，Density 与 Theme 正交 | ACTIVE；保留三密度值，不增加未批准间距级别 |
| Surface | `src/theme/styles/tokens.css`、五主题 CSS、`SEMANTIC_MAPPING.json` | canvas/default/subtle/raised/overlay 均为主题层派生别名 | ACTIVE；不增加新颜色源 |
| Border | 五主题 `--gp-line-*`、`tokens.css` | default 已有；divider/subtle 语义引用此前缺少显式别名 | ACTIVE；补齐 `--gp-border-divider/subtle` |
| Text | 五主题 `--gp-text-n*`、`tokens.css` | primary/secondary 已有，tertiary/muted/disabled 缺少通用别名 | ACTIVE；补齐三项别名 |
| Radius | `tokens.css`、`components.css` | none/tag/control/card/dialog/full 固定几何已存在 | PENDING；主题化候选值未批准，不写入 runtime |
| Shadow | `tokens.css`、`components.css`、`layout.css` | card/popover/modal 三层兼容值已存在 | PENDING；结构化 elevation canonical 值未批准 |
| Icon | Lucide/Nuxt UI 使用、`--gp-icon-size-sm/md` | 尺寸别名存在，family/line-width/语义集合未冻结 | PENDING；不新增 family Token |
| Motion | `--gp-sidebar-transition`、reduced-motion 规则 | 200ms 和 0ms 已有且用于布局 | PENDING；SaaS 范围不是 GPU 精确批准值 |
| Layout | `tokens.css`、`layout.css`、`AppShell.vue` | Header 60px、Sidebar 200/64px、Breadcrumb Header 已保留 | ACTIVE；新增断点/Z-index/覆盖值需 ADR |

## 已补齐的基础 Token

本轮只新增来自既有批准来源的语义别名，不增加主题 HEX、业务 API 或组件实现：

- `--gp-border-divider` → `--gp-line-n250`
- `--gp-border-subtle` → `--gp-line-n200`
- `--gp-text-tertiary` → `--gp-text-n600`
- `--gp-text-muted` → `--gp-text-n500`
- `--gp-text-disabled` → `--gp-text-n400`
- `--gp-primary-accent` → `--gp-brand-g400`
- `--gp-primary-light` → `--gp-brand-g300`
- `--gp-type-numeric-variant` → `tabular-nums`
- `--gp-type-code-family` → `ui-monospace, SFMono-Regular, Menlo, monospace`

这些值与 `typography.json`、五主题字典和 F2 Semantic/Component Schema 一致；`typography.manager.ts` 仍在运行时设置 Typography 值，CSS 回退只负责首屏和无脚本场景。

## 未批准参数与 ADR 待决

| 项目 | 当前状态 | 处理 |
|---|---|---|
| 主题化 Radius | PROPOSED | 保留固定 GPU 几何，等待 ADR |
| 结构化 Shadow elevation | PENDING | 保留三层已有变量，等待 canonical source |
| Motion duration tiers | PROPOSED | 保留 200ms sidebar/reduced-motion 0ms |
| Icon family、线宽、语义集合 | PROPOSED | 保留现有 Lucide/Nuxt UI 与尺寸别名 |
| Z-index scale、新断点、可配置布局覆盖 | PROPOSED | 不新增运行时值 |
| DataViz 六类色板 | PROPOSED | 保留 `--gp-chart-1..5` |

## 真实审计命令

环境：macOS Darwin arm64；Node `v22.22.0`；pnpm `9.3.0`；Python `3.11.9`。

| 命令 | 退出码 | 结果 |
|---|---:|---|
| `pnpm validate:f2-tokens` | 0 | F2 Primitive、键集合、Semantic/Component 引用通过 |
| `pnpm validate:design-contract` | 0 | 五主题来源 parity、registry、runtime namespace 通过 |
| `pnpm validate:f3-tokens` | 0 | Density、Surface、兼容别名和 namespace 通过 |
| `pnpm typecheck` | 0 | 生产源码类型检查通过 |
| `pnpm typecheck:showcase` | 0 | Showcase 类型检查通过 |
| `pnpm lint` | 0 | ESLint 通过 |
| `git diff --check` | 0 | 无空白错误 |

永久豁免的 axe-core、Firefox/WebKit、截图基线审批和人工 WCAG 评审未执行，状态为 **EXEMPT**。
