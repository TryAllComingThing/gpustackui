# Scripts

`scripts/` 只保留可复现、被 npm、CI 或质量脚本调用的入口。质量证据统一写入 `docs/quality/`，不得生成顶层 `artifacts/` 目录。

| Script | Command | Responsibility | Evidence |
|---|---|---|---|
| `generate_theme_css.py` | `npm run generate:theme-css` | 从五套主题 JSON 生成运行时 CSS。 | `src/theme/styles/themes/*.css` |
| `generate_theme_css.py --check` | `npm run check:theme-css` | 只读校验生成 CSS 是否与 Token 源一致。 | stdout/stderr 与退出码 |
| `validate_contracts.py` | `npm run validate:design-contract` | 校验设计权威、必需文档、五个 Skill 合同、npm 目标存在性。 | stdout/stderr 与退出码 |
| `validate_tokens.py` | `npm run validate:tokens` | 校验 Primitive 主题与生成 CSS，以及 Semantic/Component 映射、兼容别名、动效与 Density。 | stdout/stderr 与退出码 |
| `quality_check.py` | `npm run quality:check` | 执行统一质量门禁并生成机器证据。 | `docs/quality/` |
| `quality_release.mjs` | `npm run quality:release` | 复用统一质量结果，并检查干净候选版本与人工批准。 | `docs/quality/releases/` |

## Rules

- 新增脚本前先确认不能通过现有 npm、Vite、Vitest、Playwright 或 Nuxt UI 能力完成。
- `package.json` 不得保留目标文件不存在的脚本；`validate_contracts.py` 会阻止该情况。
- 缺失 `docs/quality/open-defects.csv` 视为 P0，不允许静默移除缺陷门禁。
- 浏览器测试使用 Playwright 配置，不再保留独立烟测文件。
- 发布脚本不得自行制造人工批准；`PASS` 需要干净候选版本、统一质量门禁通过和候选版本对应的批准信息。
