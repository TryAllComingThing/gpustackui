# Vue 3 SaaS Framework Theme Contract

默认公开主题 ID：`standard`、`business`、`future`。当前运行时存在 `sky`、`ocean` 兼容扩展；新增、删除或重命名主题必须先形成 ADR。

| Framework ID | Source Design ID | Runtime CSS | Registry |
|---|---|---|---|
| standard | E | `src/theme/styles/themes/standard.css` | `src/theme/theme.registry.ts` |
| business | A2 | `src/theme/styles/themes/business.css` | `src/theme/theme.registry.ts` |
| future | D | `src/theme/styles/themes/future.css` | `src/theme/theme.registry.ts` |
| sky (compatibility) | B | `src/theme/styles/themes/sky.css` | `src/theme/theme.registry.ts` |
| ocean (compatibility) | C | `src/theme/styles/themes/ocean.css` | `src/theme/theme.registry.ts` |

主题 CSS 由 `scripts/generate_theme_css.py` 从 `src/theme/tokens/themes/` 可重复生成；生产与 Showcase 共用 `src/theme/styles/nuxt-ui.bridge.css`，由 `--gp-*` 语义变量映射到 Nuxt UI `--ui-*`。主题切换和持久化由 `src/theme/theme.manager.ts` 负责；Density 由 `src/theme/density.manager.ts` 负责。两者必须独立写入 `data-theme` 与 `data-density`，不得相互覆盖。业务组件只引用 `--gp-*`，不得引入 `--ds-*`。
