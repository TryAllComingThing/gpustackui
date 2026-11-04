# Vue 3 SaaS Framework Theme Contract

公开一等主题 ID：`standard`、`business`、`future`、`sky`、`ocean`。五套主题同源、平等，无兼容/扩展分级；新增、删除或重命名主题必须先形成 ADR。

| Framework ID | Source Design ID | Runtime CSS | Registry |
|---|---|---|---|
| standard | E | `src/theme/styles/themes/standard.css` | `src/theme/theme.registry.ts` |
| business | A2 | `src/theme/styles/themes/business.css` | `src/theme/theme.registry.ts` |
| future | D | `src/theme/styles/themes/future.css` | `src/theme/theme.registry.ts` |
| sky | B | `src/theme/styles/themes/sky.css` | `src/theme/theme.registry.ts` |
| ocean | C | `src/theme/styles/themes/ocean.css` | `src/theme/theme.registry.ts` |

主题 CSS 由 `scripts/generate_theme_css.py` 从 `src/theme/tokens/themes/` 可重复生成；生产与 Showcase 共用 `src/theme/styles/nuxt-ui.bridge.css`，由 `--gp-*` 语义变量映射到 Nuxt UI `--ui-*`。主题切换和持久化由 `src/theme/theme.manager.ts` 负责；Density 由 `src/theme/density.manager.ts` 负责。两者必须独立写入 `data-theme` 与 `data-density`，不得相互覆盖。业务组件只引用 `--gp-*`，不得引入 `--ds-*`。

## 框架全景

- 架构：主题 JSON 经生成脚本输出五套 `data-theme` CSS；`theme.manager.ts` 负责初始化、切换和持久化，`nuxt-ui.bridge.css` 负责 Nuxt UI 消费。
- 设计思路：五主题同源、五套一等主题；Theme 与 Density/Typography/Layout 正交。
- 设计理念：单一事实来源、可重复生成、兼容可逆、生产与 Showcase 同源。
- 落地路径：源 JSON → 生成 → CSS bridge → Theme manager → 五主题/三密度浏览器验证。
- 落地方案：新增/删除/重命名主题必须先有 ADR；生成文件不手改；证据写入 `docs/quality/`。详见 `docs/architecture/ARCHITECTURE.md`。
