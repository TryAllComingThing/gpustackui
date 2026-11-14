# Scripts

`scripts/` 保存框架日常开发脚本。脚本应只做一件明确的事。

| Script | Command | Responsibility |
|---|---|---|
| `generate_theme_css.py` | `npm run generate:theme-css` | 从五套主题 JSON 生成运行时 CSS。 |
| `generate_theme_css.py --check` | `npm run check:theme-css` | 检查生成 CSS 是否与 Token 源一致。 |
| `check_tokens.py` | `npm run check:tokens` | 检查主题、Semantic/Component 映射、兼容 alias、动效与 Density 的结构。 |
| `search_reuse.mjs` | `npm run reuse:search -- <关键词>` | 搜索可复用的组件、Composable、Utils、Service 和模块实现。 |
| `create_module.mjs` | `npm run create:module -- <name>` | 创建模块骨架、路由、i18n key 和可选测试。 |

## 约定

- 新增脚本前先确认现有 npm、Vite、Vitest、Playwright 或 Nuxt UI 能力无法完成。
- `package.json` 不保留目标文件不存在的脚本。
- 主题脚本只修改 `src/theme/styles/themes/*.css`，Token 事实来源始终是 `src/theme/tokens/`。
- 复用搜索只输出候选，最终选择由实现者判断。
- 脚本失败时输出明确错误并返回非零退出码，不隐藏失败。
