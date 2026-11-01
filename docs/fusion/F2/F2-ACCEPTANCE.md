# F2 Token 与主题运行时验收

总体状态：**F2-PASS**（仅针对本次 F2 范围；永久豁免项保持 EXEMPT）

环境：macOS Darwin arm64；Node `v22.22.0`；pnpm `9.3.0`；Python `3.11.9`；Playwright Chromium。

| 编号 | 验收项 | 实际证据 | 退出码 | 状态 |
|---|---|---|---:|---|
| F2-01 | Primitive Token Schema 与五主题键集合 | `pnpm validate:f2-tokens`；`scripts/validate_f2_tokens.py` | 0 | PASS |
| F2-02 | Semantic/Component 引用解析 | `pnpm validate:f2-tokens`，检查映射目标是否存在于 Primitive/Semantic 集合 | 0 | PASS |
| F2-03 | 五主题 CSS 生成幂等 | `pnpm generate:theme-css` 连续执行两次并比较五份 CSS SHA-256 | 0 | PASS |
| F2-04 | 五主题切换与真实计算 Token | `pnpm test:e2e`；`tests/e2e/f3-third-round.e2e.ts`；`pnpm test:showcase` | 0 | PASS |
| F2-05 | localStorage 恢复与非法值回退 | `pnpm test:unit`；`tests/unit/theme-manager.spec.ts`；生产 E2E reload | 0 | PASS |
| F2-06 | Nuxt UI bridge 计算样式 | `tests/visual/showcase.spec.ts`：`--ui-primary` 与 `--gp-primary` 计算值一致，真实 UButton 最终背景色一致 | 0 | PASS |
| F2-07 | 视觉回归与截图证据 | Chromium 生产 E2E 3 tests；五主题×三密度共 15 张截图 | 0 | PASS |
| F2-08 | 类型检查与 Lint | `pnpm typecheck`、`pnpm typecheck:showcase`、`pnpm lint` | 0 | PASS |
| F2-09 | 生产与 Showcase 构建 | `pnpm build`、`pnpm build:showcase` | 0 | PASS |
| F2-10 | Showcase 生产隔离 | 构建完成后顺序执行 `pnpm check:showcase-isolation` | 0 | PASS |
| F2-11 | P0/P1 缺陷关闭 | `docs/fusion/F2/F2-DEFECTS.csv`；F2-D-005/F2-D-006 P1 缺陷已关闭，无开放 P0/P1 | 0 | PASS |
| F2-12 | `dev:showcase` 根入口启动 | `showcase/vite.config.ts` 重定向 `/` → `/showcase/index.html`；localhost Chromium 状态 200、标题可见、控制台无错误 | 0 | PASS |

## 命令与报告留存

| 命令/报告 | 结果 |
|---|---|
| `pnpm validate:f2-tokens` | 退出码 0；Primitive Schema、键集合、引用解析通过 |
| `pnpm validate:design-contract` | 退出码 0；五主题来源、registry、runtime namespace、SaaS/工程副本 parity 通过 |
| `pnpm validate:f3-tokens` | 退出码 0；F3 兼容 Token/Density 校验通过 |
| `pnpm generate:theme-css` × 2 | 退出码 0；`idempotent: True` |
| `pnpm test:unit` | 退出码 0；6 tests passed |
| `pnpm test:e2e` | 退出码 0；3 tests passed；报告：[index.html](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/playwright-report-f2-e2e/index.html) |
| `pnpm test:showcase` | 退出码 0；2 tests passed；报告：[index.html](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/playwright-report-f2-showcase/index.html) |
| 主题矩阵截图 | 15 张，目录：[screenshots](/Users/kyle/Documents/AI-Innovation-RD/GPUStack/gpustack-vue-frontend/test-results/e2e-f3-third-round.e2e.ts--c8945-l-runtime-tokens-and-layout/screenshots) |
| Playwright 最近结果 | `test-results/.last-run.json`：`status=passed`、`failedTests=[]` |
| `pnpm build` | 退出码 0；生产构建完成 |
| `pnpm build:showcase` | 退出码 0；Showcase 构建完成，Nuxt UI chunk 约 455 kB |
| `pnpm check:showcase-isolation` | 退出码 0（构建完成后顺序执行） |
| `git diff --check` | 退出码 0 |
| `npm run dev:showcase -- --host 127.0.0.1 --port 4176` + Chromium root probe | 302 → `/showcase/index.html`，最终状态 200，`Theme & Component Showcase` 可见，errors=[] |

## 曾失败的执行

这些执行没有被计入 PASS 证据，已在 `F2-DEFECTS.csv` 登记并通过修复后的命令关闭：

- 新增 Nuxt UI 断言首次把浏览器解析后的 `#0D61F2` 错当作 `var(--gp-primary)`，退出码 1。
- 主题切换后的 `transition-colors` 中间帧导致颜色立即比较失败，退出码 1；改为等待最终计算样式后通过。
- 与生产构建并行执行隔离脚本时，脚本先于 `dist` 生成，退出码 2；构建完成后顺序重跑退出码 0。
- HTML 报告输出到 `test-results` 子目录被 Playwright 报目录冲突警告（命令退出码 0但未生成有效报告）；改用仓库根目录独立报告目录后退出码 0。
- 上述无效 reporter 尝试清理了旧的 `test-results` 截图目录；随后重新执行 `pnpm test:e2e`，恢复并核验 15 张截图。

## 永久豁免

axe-core、Firefox/WebKit、截图基线审批、人工 WCAG 评审：**EXEMPT**。本轮未执行这些项目，也未将其标记为 PASS。
