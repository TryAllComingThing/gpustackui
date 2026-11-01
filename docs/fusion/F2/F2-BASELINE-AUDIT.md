# F2 基线审计：Theme Engine、五主题 Token 与 Nuxt UI 映射

总体状态：**REVIEW**

审计唯一依据：根目录 `DESIGN.md`。本报告不引入 GPUStack Profile；`standard`、`business`、`future` 是默认公开主题 ID，现有 `sky`、`ocean` 仅记录为兼容扩展。

## 审计结果

| 领域 | 实际路径 | 结论 | 状态 |
|---|---|---|---|
| Theme Engine | `src/theme/theme.types.ts`、`theme.registry.ts`、`theme.manager.ts` | ID、designId 映射、data-theme、localStorage、非法值回退已存在 | PASS |
| 默认主题契约 | `src/theme/theme.types.ts` | standard/business/future 保留；sky/ocean 为已有兼容扩展，不是新增 Profile | REVIEW |
| 五主题 Primitive | `src/theme/tokens/themes/A2.json`、B/C/D/E | 五份字典存在，结构和 HEX parity 由契约脚本审计 | PASS |
| 五主题 CSS | `scripts/generate_theme_css.py`、`src/theme/tokens/themes/*.json`、`src/theme/styles/themes/*.css` | 五份运行时 CSS 可重复生成，提供 Brand/Success/Warning/Danger/Info/Text/Line/Background/Alpha 语义层 | PASS |
| Primitive Schema | `src/theme/tokens/schema/primitive.schema.json` | 新增 JSON Schema，覆盖五主题字典必需键和 HEX 格式 | PASS |
| Semantic Schema | `src/theme/tokens/schema/semantic.schema.json`、`SEMANTIC_MAPPING.json` | 语义路径映射存在，Schema 已登记 | PASS |
| Component Schema | `src/theme/tokens/schema/component.schema.json`、`COMPONENT_MAPPING.json` | 组件 Token 映射存在，Schema 已登记 | PASS |
| Nuxt UI 映射 | `src/theme/styles/nuxt-ui.bridge.css`、`src/theme/styles/main.css`、`showcase/showcase.css` | 生产与 Showcase 共用同一 `--ui-*` → `--gp-*` 桥接，无 `--ds-*` | PASS |
| Showcase 隔离 | `showcase/main.ts`、`showcase/vite.config.ts`、`quality/check_showcase_isolation.py` | 独立入口、独立构建和生产隔离检查存在 | PASS |
| 兼容别名 | `src/theme/styles/tokens.css`、`typography.css`、`layout.css` | 旧别名指向 `--gp-*`，未删除 | PASS |
| 待决主题扩展 | `docs/fusion/FRAMEWORK/FUSION-MATRIX.csv` | 新主题、主题 Radius、DataViz 扩展仍需 ADR | PROPOSED |

## 关键结论

1. F2 主题和 Token 资产已具备可审计基线；本轮只修改主题生成脚本、主题 CSS 输出、桥接 CSS、类型/契约脚本和文档，没有修改业务组件、业务逻辑或依赖。
2. 现有源码包含五个 runtime ID，但框架默认公开契约仍是 standard/business/future；sky/ocean 不被重新定义为项目 Profile。
3. 五套 A2/B/C/D/E 字典已存在，新增 Schema 只描述和校验现有资产，不复制 HEX。
4. 主题、Semantic、Component 三层映射已分别落到 JSON Schema、`--gp-*` CSS 和 Nuxt UI `--ui-*` 映射。
5. 未批准的主题 Radius、Shadow elevation、Motion、Icon family、DataViz 色板继续保持 PROPOSED/PENDING。

## 实际审计命令

环境：macOS Darwin，Node workspace runtime，pnpm 9.3.0。

| 命令 | 退出码 | 结果 |
|---|---:|---|
| 五主题 JSON parity + Schema JSON load + 五主题 CSS 语义覆盖 Python 审计 | 0 | 5 个字典结构/键集合一致；3 个 Schema JSON 可解析；5 份主题 CSS 语义变量齐全 |
| `pnpm validate:design-contract` | 0 | 契约、Theme registry、runtime namespace 和 gate 校验通过 |
| `pnpm validate:f3-tokens` | 0 | Typography/Density Schema、data-density、别名和 namespace 校验通过 |
| `pnpm typecheck` | 0 | 通过 |
| `pnpm generate:theme-css` | 0 | 五主题 CSS 可重复生成 |
| `pnpm build` | 0 | 生产构建通过 |
| `pnpm build:showcase` | 0 | Showcase 构建通过 |
| `pnpm test:e2e` | 0（提升权限重跑） | Chromium 3 tests passed |
| `pnpm test:showcase` | 0（提升权限重跑） | Chromium 2 tests passed |
| `git diff --check` | 0 | 通过 |

本轮没有修改业务组件、业务逻辑或依赖；主题 CSS、共享桥接和 Theme Engine 契约按 F2 范围更新。未批准视觉扩展仍保持 PROPOSED/PENDING。
