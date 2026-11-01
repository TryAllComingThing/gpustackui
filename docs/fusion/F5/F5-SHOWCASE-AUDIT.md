# F5 Showcase 与工程治理审计

状态：REVISE（初步实现与严格验证已完成，待 F5 专项人工评审）。唯一设计权威仍为根目录 `DESIGN.md`；本次不新增 DESIGN.md、Profile 或主题引擎。

## REUSE / MODIFY / REMOVE / DEFER

| 范围 | 分类 | 真实路径 | 处理结论 |
|---|---|---|---|
| Theme runtime | REUSE | `src/theme/theme.manager.ts`、`src/theme/theme.registry.ts` | Showcase 继续使用五主题运行时和持久化，不复制主题逻辑 |
| Density runtime | MODIFY | `src/theme/density.manager.ts`、`showcase/main.ts`、`showcase/App.vue` | 初始化并暴露 compact/standard/comfortable 选择，保持与 data-theme 正交 |
| Typography/Layout runtime | REUSE | `src/theme/typography.manager.ts`、`src/theme/layout.manager.ts` | Showcase 初始化并展示真实运行时状态 |
| Nuxt UI primitives | REUSE | `@nuxt/ui@4.12.0`、Showcase sections | 继续直接使用 UButton/UInput/USelect/UForm/UTable/UModal 等 |
| F4 adapters | REUSE | `src/components/common/Drp*.vue` | Showcase 继续直接引用生产适配器 |
| F4 Patterns | REUSE | `src/components/patterns/*.vue` | PatternSection 只组合共享 Pattern，不创建演示副本 |
| Showcase information architecture | MODIFY | `showcase/App.vue`、`showcase/showcase.css` | 增加 Tokens、Components、States、Patterns、Accessibility、Quality 锚点导航和独立区块 |
| Existing token swatches/matrix | REUSE | `showcase/App.vue`、`showcase/component-matrix.ts` | 保留真实 Token 和状态矩阵展示 |
| Showcase-only component wrappers | REMOVE | 无新增；现有 sections 仅为组合入口 | 禁止新增 Drp/UI 镜像封装 |
| Second DESIGN.md / Profile | REMOVE | 未创建 | 根目录 DESIGN.md 继续唯一权威，不引入项目 Profile |
| Production business API calls | DEFER | `showcase/fixtures/*` | 继续使用本地 fixtures；业务后端接入不属于 Showcase |
| 未批准 DataViz 扩展 | DEFER | `DESIGN.md`、F2/F3 mapping | 保留现有 chart tokens，不自行生成新色板 |

## 五个 Codex Skills

| Skill | 真实用途 | 当前资产 | 分类 |
|---|---|---|---|
| `gpustack-design-system` | Token、主题、组件和证据门禁 | `scripts/validate_contracts.py`、F4 gate/state、Theme/Showcase | REUSE |
| `gpustack-page-migration` | 单页 API/行为保真迁移 | `src/modules/*/pages`、production E2E | DEFER，当前 Showcase 任务不迁移业务页 |
| `gpustack-visual-qa` | 多主题视觉、axe、浏览器和快照 | `playwright.strict.config.ts`、`tests/strict`、F4 snapshots | REUSE |
| `gpustack-repo-audit` | 存量审计和证据路径 | F0/F1 资产与本报告 | REUSE |
| `gpustack-release-gate` | 构建、测试、审批和回滚证据 | `scripts/gate.py`、`scripts/task_state.py`、F4 gate/state | REUSE |

## 质量与测试资产结论

- `quality/check_showcase_isolation.py` 保留并继续验证 Showcase 不进入生产 dist。
- `scripts/validate_contracts.py` 保留为设计契约入口。
- `pnpm test:strict` 覆盖 Chromium、Firefox、WebKit、axe-core、键盘、状态、主题密度和视觉快照；严格门禁不复制组件实现。
- `tests/visual/showcase.spec.ts` 覆盖五主题、表格、表单、导航和 Pattern；本轮增加 IA 区块存在性检查。
- `docs/DESIGN-TRACEABILITY.csv` 将规范、源码、测试和状态绑定到真实路径。

## 风险与后续

- Showcase CSS 仍是验收布局样式，不能被生产页面引用。
- `component-matrix.ts` 是状态数据资产，不是组件实现；状态覆盖仍由真实组件渲染和测试证明。
- 未批准的 DataViz、Radius、Shadow、Motion、Icon 扩展继续 DEFER/PROPOSED，不写入新的 runtime Token。
