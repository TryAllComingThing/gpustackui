# F3 Token Source Migration

状态：**PASS**（源码/生成器依赖迁移完成）

## 唯一来源

`src/theme/tokens/` 现在是唯一机器可读 Token 根目录：

- `themes/A2.json`、`B.json`、`C.json`、`D.json`、`E.json`
- `typography.json`、`density.json`
- `SEMANTIC_MAPPING.json`、`COMPONENT_MAPPING.json`
- `schema/*.json`
- `visual-foundation.json`

运行时和生成器不再读取 `design-system/tokens` 或 `SaaS-Design-System-V1.1-M0/tokens`。两个旧目录已在完成核对后删除；来源关系由 `src/theme/tokens/README.md` 和本报告保留。

## 迁移映射

| 旧来源 | 新路径 | 使用方 |
|---|---|---|
| SaaS/design-system `tokens/themes/*.json` | `src/theme/tokens/themes/*.json` | theme CSS generator / contract validator |
| migrated Typography token | `src/theme/tokens/typography.json` | Typography manager |
| migrated Density token | `src/theme/tokens/density.json` | Density manager |
| SaaS semantic/component mappings | `src/theme/tokens/SEMANTIC_MAPPING.json`, `COMPONENT_MAPPING.json` | F2 validation |
| F2/F3 schemas | `src/theme/tokens/schema/*.json` | F2/F3 validation |
| SaaS visual foundation | `src/theme/tokens/visual-foundation.json` | SaaS-only foundation validation |

## 兼容性

- CSS runtime 变量、主题 ID、localStorage key、业务 API 和组件公共 API 未改变。
- 生成后的五份主题 CSS 内容保持一致；迁移只改变输入路径。
- SaaS visual foundation 明确不映射 GPU `--gp-*` runtime。
- 删除已完成；删除后已再次运行所有 Token 校验、类型、构建和 Playwright 门禁。

## 验证

| 命令 | 退出码/结果 |
|---|---|
| `pnpm generate:theme-css` | 0；从 `src/theme/tokens/themes` 生成五主题 CSS |
| `pnpm generate:saas-visual-foundation` | 0；从 `src/theme/tokens/themes` 生成 SaaS foundation |
| `pnpm validate:f2-tokens` | 0 |
| `pnpm validate:f3-tokens` | 0 |
| `pnpm validate:saas-visual-foundation` | 0 |
| `pnpm validate:design-contract` | 0 |
| `pnpm typecheck` / `typecheck:showcase` | 0 |
| `pnpm test:unit` | 9 tests passed |
| `pnpm build` / `build:showcase` | 0 |
| `pnpm test:e2e` | 4 tests passed |
| `pnpm test:showcase` | 2 tests passed |
| `pnpm check:showcase-isolation` | 0 |
| `git diff --check` | 0 |
