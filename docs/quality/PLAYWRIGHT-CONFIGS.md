# Playwright Configuration Guide

## `playwright.config.ts`

用途：生产应用 E2E 烟测。

- `testDir: tests`，只匹配 `**/*.e2e.ts`。
- 只启动一个 worker，单用例超时 90 秒。
- 启动 `npm run dev -- --host 127.0.0.1 --strictPort`，访问 `http://127.0.0.1:5173`。
- 固定 Chromium、`zh-CN`、`UTC`；失败时保留 trace 和截图。
- 用于验证生产路由、导航折叠、面包屑和业务页面行为。

## `playwright.showcase.config.ts`

用途：Showcase 视觉与组件验收。

- `testDir: tests/visual`，单用例超时 30 秒。
- 先执行 `npm run build:showcase`，再在 `http://127.0.0.1:4175` 预览 `dist-showcase`。
- 入口为 `/showcase/index.html`，使用桌面 Chromium 视口。
- 用于检查矩阵、真实组件状态、主题切换、表格操作和弹窗行为。

## `playwright.strict.config.ts`

用途：严格浏览器门禁。

- `testDir: tests/strict`，单 worker、单用例超时 45 秒。
- 构建 Showcase 后在 `http://127.0.0.1:4176` 预览，独立端口避免与视觉门禁冲突。
- 固定浅色 Chromium、`zh-CN`、`UTC`；失败时保留 trace 和截图。
- 测试内部执行 axe、`prefers-reduced-motion` 和键盘焦点恢复检查。
- HTML 报告输出到 `playwright-report-strict`，名称不绑定任何交付阶段。

## `playwright.accessibility.config.ts`

用途：Showcase 无障碍专项验收。

- `testDir: tests/accessibility`，单 worker、单用例超时 45 秒。
- 构建 Showcase 后在 `http://127.0.0.1:4175` 预览。
- 执行 axe WCAG A/AA 扫描，并验证键盘打开/关闭弹窗和焦点恢复。
- HTML 报告输出到 `playwright-report-accessibility`。
- 与 `playwright.showcase.config.ts` 共用 4175 端口，两个门禁必须串行执行。

## Execution Rules

- 四个配置均设置 `reuseExistingServer: false`，每次门禁使用新构建。
- 所有 webServer 命令统一使用 `npm run` / `npm exec --`，不依赖 pnpm。
- 任何配置的失败报告和截图都保留在 `playwright-report-*` 与 `test-results/`，不得自动接受或删除失败证据。
