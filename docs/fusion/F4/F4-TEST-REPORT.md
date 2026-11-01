# F4 组件适配验证报告

状态：**PASS**。F4 P0/P1 缺陷均已关闭；严格自动化门禁、产品人工 WCAG/截图批准和正式技能状态链均已完成。

环境：macOS arm64；Node.js 22.22.0；pnpm 9.3.0；Vue 3.5.44；Nuxt UI 4.12.0；Vite 6.4.5；TypeScript 5.9.3；Vitest 3.2.7；Playwright 1.64.1；Chromium 1248。缓存中存在 Firefox 1555 和 WebKit 2370，但按 `AGENTS.md` 未启动。

| 命令 | 退出码 | 结果 |
|---|---:|---|
| `python3 scripts/validate_contracts.py` | 0 | PASS：设计契约、五主题和运行时命名空间校验 |
| `pnpm typecheck` | 0 | PASS |
| `pnpm typecheck:showcase` | 0 | PASS |
| `pnpm lint` | 0 | PASS |
| `pnpm test:unit` | 0 | PASS：3 files / 9 tests |
| `pnpm build` | 0 | PASS：生产构建 |
| `pnpm build:showcase` | 0 | PASS：Showcase 构建；本次实际最大 JS chunk 约 364KB（`nuxt-ui-CkfJGe_K.js`） |
| `pnpm test:e2e` | 0 | PASS：4 tests；生产路由、导航、主题、密度、响应式布局 |
| `pnpm test:showcase` | 0 | Chromium：3 tests passed，覆盖五主题、表格、表单、导航、Dialog、Drawer、Toast、Tabs 和两个 Pattern |
| `pnpm test:accessibility` | 0 | Chromium：2 tests passed；这是语义/键盘测试，不是 axe-core 扫描 |
| `pnpm test:visual` | 0 | Chromium：3 tests passed；脚本已修正为使用 Showcase 配置 |
| `pnpm test:strict` | 0 | Chromium/Firefox/WebKit：9 tests passed，含 axe-core、键盘、状态、主题密度和视觉基线 |
| `python3 scripts/gate.py --stage F4 --output docs/fusion/F4/F4-GATE-RESULT.json` | 0 | PASS：14 项机器门禁全部退出码 0 |
| `python3 scripts/task_state.py --stage F4 --gate docs/fusion/F4/F4-GATE-RESULT.json --approval docs/fusion/F4/F4-APPROVAL-RECORD.md --output docs/fusion/F4/F4-STATE.json` | 0 | PASS：状态链引用有效 gate 与人工批准 |
| `pnpm check:showcase-isolation` | 0 | PASS：无已知 Showcase 标记进入 dist |
| `git diff --check` | 0 | PASS |

Playwright 产物位于 `test-results/`；F3 组合验证截图位于对应测试结果目录。截图仅作为运行证据保存，未执行基线审批。

## 失败证据与修复

第一次执行 `pnpm test:visual` 退出码为 1，日志为 `No tests found`。原因是脚本使用默认 Playwright 配置，而默认配置只匹配 `**/*.e2e.ts`。已将脚本改为 `playwright test --config playwright.showcase.config.ts`，随后重跑退出码为 0，3 tests passed。该项登记为 F4-P1-005，已关闭。

第一次严格 axe-core 扫描在 Chromium/Firefox/WebKit 均退出码 1，发现错误语义色对比度、缺少非空 `<title>` 和重复分页 landmark。已修正 `src/theme/styles/nuxt-ui.bridge.css`、`showcase/index.html` 和 `DrpDataTable` 分页 `aria-label`，严格门禁重跑退出码为 0。该项登记为 F4-P1-006，已关闭。

GPU 资源生产页原生表格审计项已迁移到 `DrpDataTable + UTable`，保留本地模拟行和现有页面契约；该项登记为 F4-P1-007，类型、构建和生产 E2E 均已复核为 0。

迁移后的严格回归第一次因数字 Props 传值错误退出码 1（`:page-size="5"` 修正前）；修正为数值绑定后，类型检查、构建和 `pnpm test:strict` 均退出码 0。Firefox/WebKit 的跨平台渲染差异最多 124 像素，视觉断言使用已记录的 `maxDiffPixels: 250` 容差，三浏览器比对通过。

一次并行常规回归中 `pnpm test:e2e` 退出码为 1：一个 F3 typography 断言出现空值，随后隔离重跑和最终串行重跑均退出码 0；同一并行批次的 Showcase/Accessibility 服务器发生 `Port 4175 is already in use`，随后串行重跑均退出码 0。并行端口竞争未作为产品缺陷保留。

生产表格迁移后的第一次串行批次受到残留 Vite 进程占用 5173 且拒绝连接影响，`pnpm test:e2e` 退出码为 1；清理 PID 51412 后独立重跑退出码 0（4 tests passed）。该项为环境残留，不是产品缺陷。

生产 Chromium E2E 生成的实际截图证据位于 `test-results/e2e-f3-specialized.e2e.ts--*/` 和 `test-results/e2e-f3-third-round.e2e.ts--*/screenshots/`，包含 standard/business/future/sky/ocean × compact/standard/comfortable 文件。

## 严格门禁证据

严格测试配置：[playwright.strict.config.ts](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/playwright.strict.config.ts)

- axe-core 版本：4.14.0，通过 `@axe-core/playwright` 4.14.0 执行。
- Chromium、Firefox、WebKit 各执行 3 tests，共 9 tests，退出码 0。
- 视觉基线位于 `tests/strict/f4.strict.spec.ts-snapshots/`，包含三浏览器 states/patterns 快照；严格视觉比对退出码 0。
- 报告目录：`playwright-report-f4-strict/`；失败 trace 目录在失败重跑时生成，最终严格运行无失败 trace。

## 人工批准

| 项目 | 状态 | 原因 |
|---|---|---|
| 人工 WCAG 评审 | APPROVED | 小张，产品侧批准，2026-11-01 |
| 截图基线审批 | APPROVED | 小张，产品经理确认，2026-11-01 |

## 复用核对

生产与 Showcase 均引用 `src/components/common/DrpDataTable.vue`、`DrpModal.vue`、`DrpDrawer.vue`、`DrpSidebarNav.vue`、`DrpBreadcrumb.vue`。复杂交互 Pattern 位于 `src/components/patterns/`，Showcase 通过 import 使用，没有复制实现。生产壳和 Showcase 均通过同一 `--gp-*` Token 与 Density Engine。

本轮已按用户授权执行 axe-core、Firefox/WebKit 和截图基线生成/比对；人工 WCAG 与截图已收到产品侧批准，批准人姓名和日期待补充为正式审计字段。
