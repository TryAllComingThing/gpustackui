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
| Lint | `npm run lint` | exit code and stdout/stderr |
| Unit | `npm run test:unit` | exit code and Vitest output |
| Production build | `npm run build` | exit code and build output |
| Showcase build | `npm run build:showcase` | exit code and build output |
| Production E2E | `npm run test:e2e` | Playwright HTML report and failure artifacts |
| Showcase visual | `npm run test:visual` | Playwright HTML report and failure artifacts |
| Accessibility | `npm run test:accessibility` | Playwright HTML report and failure artifacts |
| Strict gate | `npm run test:strict` | Playwright HTML report and failure artifacts |
| Unified check | `npm run quality:check` | `docs/quality/` summary and reports |
| Release gate | `npm run quality:release` | `docs/quality/releases/` |

## Playwright Configuration Map

- `playwright.config.ts`: production E2E.
- `playwright.showcase.config.ts`: Showcase visual acceptance.
- `playwright.strict.config.ts`: Chromium strict gate for axe, reduced motion and keyboard focus.
- `playwright.accessibility.config.ts`: dedicated Showcase accessibility scan.

Detailed behavior and port allocation are documented in `docs/quality/PLAYWRIGHT-CONFIGS.md`.
