# Quality Gates

本文件是仓库质量门禁说明。包管理统一使用 npm；不得新增 pnpm 锁文件或 pnpm 专用脚本。

## Required Commands

| Gate | Command | Output |
|---|---|---|
| Contracts and Skills | `npm run validate:design-contract` | exit code and stdout/stderr |
| Theme CSS freshness | `npm run check:theme-css` | exit code and stdout/stderr |
| Tokens | `npm run validate:tokens` | exit code and stdout/stderr |
| Typecheck | `npm run typecheck` | exit code and stdout/stderr |
| Showcase typecheck | `npm run typecheck:showcase` | exit code and stdout/stderr |
| Lint | `npm run lint` | exit code and stdout/stderr；覆盖 JS、TS、Vue |
| Unit | `npm run test:unit` | exit code and Vitest output |
| Production build | `npm run build` | exit code and build output |
| Showcase build | `npm run build:showcase` | exit code and build output |
| Production E2E | `npm run test:e2e` | Playwright HTML report and failure artifacts |
| Showcase visual | `npm run test:visual` | Playwright HTML report and failure artifacts |
| Accessibility | `npm run test:accessibility` | Playwright HTML report and failure artifacts |
| Strict gate | `npm run test:strict` | Playwright HTML report and failure artifacts |
| Diff hygiene | `git diff --check` | exit code and whitespace violations |
| Unified check | `npm run quality:check` | `docs/quality/` summary and reports |
| Release gate | `npm run quality:release` | stdout only |

## Playwright Configuration Map

- `playwright.config.ts`: production E2E.
- `playwright.showcase.config.ts`: Showcase visual acceptance.
- `playwright.strict.config.ts`: Chromium strict gate for axe, reduced motion and keyboard focus.
- `playwright.accessibility.config.ts`: dedicated Showcase accessibility scan.

Detailed behavior and port allocation are documented in `docs/quality/PLAYWRIGHT-CONFIGS.md`.

文本文件统一使用 LF；`.gitattributes` 声明 `text=auto eol=lf`。质量门禁直接执行 `git diff --check`，CRLF 或尾随空白都会失败。当前全仓库已跟踪文本文件已完成 LF 归一化，包括 `.codex/skills/`。

## Baseline Approval

基线冻结必须在干净候选提交上完成，并同时满足：

1. `npm run quality:check` 退出码为 `0`，`docs/quality/summary.json` 的 `quality_decision` 为 `PASS`。
2. 质量脚本不得创建额外质量产物；批准的例外必须记录在 `BASELINE.md`。
3. 候选提交 SHA 与 `BASELINE.md`、`docs/quality/BASELINE-REVIEW.md` 和当次质量报告一致。
4. 人工批准记录包含批准人、日期、证据路径、决定和例外；仅有口头同意不算批准。
5. 自动化视觉/axe 通过不得写成人工 WCAG 通过；未执行项写 `NOT EXECUTED`。

当前 `0.2.0-internal-template-baseline` 的各角色人工批准已于 2026-11-04 记录。干净候选提交与 SHA 绑定仍待完成，因此基线状态为 `APPROVED / PENDING CLEAN CANDIDATE COMMIT`，发布门禁保持 `BLOCKED`。
