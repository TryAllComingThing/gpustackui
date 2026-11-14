# Vue 3 SaaS Framework Theme Contract

公开一等主题 ID：`standard`、`business`、`future`、`sky`、`ocean`。五套主题同源、平等；新增、删除或重命名主题必须先形成 ADR。

| Framework ID | Theme Source | Runtime CSS | Registry |
|---|---|---|---|
| standard | `src/theme/tokens/themes/standard.json` | `src/theme/styles/themes/standard.css` | `src/theme/theme.registry.ts` |
| business | `src/theme/tokens/themes/business.json` | `src/theme/styles/themes/business.css` | `src/theme/theme.registry.ts` |
| future | `src/theme/tokens/themes/future.json` | `src/theme/styles/themes/future.css` | `src/theme/theme.registry.ts` |
| sky | `src/theme/tokens/themes/sky.json` | `src/theme/styles/themes/sky.css` | `src/theme/theme.registry.ts` |
| ocean | `src/theme/tokens/themes/ocean.json` | `src/theme/styles/themes/ocean.css` | `src/theme/theme.registry.ts` |

主题 CSS 由 `scripts/generate_theme_css.py` 从 `src/theme/tokens/themes/` 可重复生成；生产与 Showcase 共用 `src/theme/styles/nuxt-ui.bridge.css`，由 `--gp-*` 语义变量映射到 Nuxt UI `--ui-*`。主题切换和持久化由 `src/theme/theme.manager.ts` 负责；Density 由 `src/theme/density.manager.ts` 负责；Appearance 由 `src/theme/appearance.manager.ts` 负责。三者独立写入 `data-theme`、`data-density` 与 `data-appearance`，不得相互覆盖。业务组件只引用 `--gp-*`，不得引入 `--ds-*`。

## Appearance

| Preference | Resolved runtime | Source | Runtime CSS |
|---|---|---|---|
| system | light / dark（跟随系统） | `src/theme/tokens/appearance.json` | `src/theme/styles/themes/appearance.css` |
| light | light | 同上 | 同上 |
| dark | dark | 同上 | 同上 |

Appearance 与 Theme ID 正交。运行时会额外切换根节点 `dark` class，仅供 Nuxt UI/Tailwind `dark:` 变体兼容；业务页面不得从该 class 派生第二套主题 Token。

## 修改路径

1. 修改 `src/theme/tokens/themes/*.json`、`appearance.json` 或相关 mapping；
2. 运行 `npm run generate:theme-css` 重新生成 `src/theme/styles/themes/*.css`；
3. 运行 `npm run check:theme-css` 和 `npm run check:tokens` 检查源与生成文件一致；
4. 在 Showcase 检查五主题 × 浅色/深色外观、三密度和键盘焦点；
5. 同步 `docs/design/TOKEN-MAPPING.md` 与相关测试。

新增、删除或重命名主题必须先有 ADR；生成文件不手改。
