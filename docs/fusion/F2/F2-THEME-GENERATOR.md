# F2 主题 CSS 生成与运行时桥接记录

状态：**REVIEW**

本轮以 `src/theme/tokens/themes/{A2,B,C,D,E}.json` 为生成输入。该目录是 SaaS V1.1-M0 的来源；`src/theme/tokens/themes/` 保留同一份经契约校验的工程副本。生成器不会从页面或组件推断颜色，也不会生成第二个主题引擎。

## 生成链

| 输入 | 生成器 | 输出 |
|---|---|---|
| SaaS A2/B/C/D/E JSON | `scripts/generate_theme_css.py` | `src/theme/styles/themes/business.css`、`sky.css`、`ocean.css`、`future.css`、`standard.css` |
| `--gp-*` 语义层 | `src/theme/styles/nuxt-ui.bridge.css` | 生产 `main.css` 与 Showcase 共用的 `--ui-*` 映射 |
| `theme.types.ts` / `theme.registry.ts` | `theme.manager.ts` | `data-theme`、无刷新切换、持久化和非法值回退 |

生成的主题 CSS 包含 Brand、Success、Warning、Danger、Info、Text、Line、Background、Alpha 及既有布局/图表兼容别名。Radius、结构化 Shadow、Motion 分级、Icon family 和六类 DataViz 色板仍未获批，生成器不会写入这些候选值。

## 兼容性风险

| 风险 | 影响 | 处理 |
|---|---|---|
| `src/theme/tokens/themes` 与 SaaS 来源目录未来发生漂移 | 生成结果可能与契约副本不一致 | 每次生成后运行 `pnpm validate:design-contract`；发布前比较两份主题 JSON 的 checksum |
| 旧页面依赖 `--header-*`、`--radius-*` 等变量 | 直接删除会造成视觉回退 | `tokens.css` 保留旧别名，并只指向 `--gp-*` |
| Nuxt UI 默认 `--ui-*` 值覆盖桥接 | 组件颜色可能脱离主题 | 生产和 Showcase 都导入同一个 `nuxt-ui.bridge.css`，桥接只引用 `--gp-*` |
| SaaS alpha `30` 值为来源字典中的 `#4C` | 与旧 Token 中的 `#4D` 存在 1 个十六进制单位差异 | 主题 CSS 以来源值为准；旧根变量保留作为无主题回退，主题选择后由生成值覆盖 |
| `sky` / `ocean` 为兼容扩展而非默认公开主题 | UI 列表若无意隐藏会改变现有行为 | `DEFAULT_THEME_IDS` 保持三项，`THEME_IDS` 仍注册五项以支持已有持久化值 |

## 实际生成与验证证据

环境：macOS Darwin arm64；Node `v22.22.0`；pnpm `9.3.0`；Python `3.11.9`。

| 命令 | 退出码 | 结果 |
|---|---:|---|
| `pnpm generate:theme-css` | 0 | 从五份 SaaS JSON 生成五份主题 CSS |
| `pnpm validate:design-contract` | 0 | 五主题 ID、来源键、HEX、运行时变量和导入关系通过 |
| `pnpm validate:f3-tokens` | 0 | Token Schema、Density、别名和 namespace 通过 |
| `pnpm typecheck` | 0 | 生产源码类型检查通过 |
| `pnpm typecheck:showcase` | 0 | Showcase 类型检查通过 |
| `pnpm build` | 0 | 生产构建通过 |
| `pnpm build:showcase` | 0 | Showcase 构建通过；Nuxt UI chunk 约 455 kB |
| `pnpm test:e2e` | 0（提升权限重跑） | Chromium 3 tests passed；首次沙箱运行因 localhost 监听 EPERM 为 1 |
| `pnpm test:showcase` | 0（提升权限重跑） | Chromium 2 tests passed；首次沙箱运行因 localhost 监听 EPERM 为 1 |
| `pnpm test:unit` | 0 | 6 tests passed |
| `pnpm check:showcase-isolation` | 0 | Showcase 未进入生产构建 |
| `pnpm lint` | 0 | ESLint 通过 |
| `git diff --check` | 0 | 无空白错误 |

永久豁免项目 axe-core、Firefox/WebKit、截图基线审批和人工 WCAG 评审均未执行，状态为 **EXEMPT**。未批准视觉扩展继续由 `docs/fusion/FRAMEWORK/VISUAL-EXTENSION-REGISTER.csv` 标记为 `PROPOSED`/`PENDING`，因此本记录保持 REVIEW。
