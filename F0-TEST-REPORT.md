# F0 实际检查报告

执行环境：2026-10-31；Node `v22.22.0`、pnpm `9.3.0`、Python `3.11.9`；工作目录为仓库根目录；未执行安装命令。

## 命令结果

| 命令 | 退出码 | 实际结果 |
|---|---:|---|
| `git diff --check` | 0 | 无 whitespace 错误 |
| `pnpm typecheck` | 0 | `vue-tsc --noEmit -p tsconfig.json` 完成 |
| `pnpm typecheck:showcase` | 0 | `vue-tsc --noEmit -p showcase/tsconfig.json` 完成 |
| `pnpm build` | 0 | Vite 生产包生成 `dist/`；13 modules transformed |
| `pnpm build:showcase` | 0 | Showcase 包生成 `dist-showcase/`；810 modules transformed |
| `pnpm lint` | 0 | ESLint 完成 |
| `pnpm check:structure` | 0 | `Checked 60 required paths; missing=0` |
| `pnpm check:showcase-isolation` | 0 | `PASS: no known showcase-only markers in dist; review imports separately` |
| `pnpm test:showcase`（第一次完整执行） | 1 | 第一测试通过；第二测试 30s 超时，等待 USelect option “空状态” |
| `pnpm exec playwright test tests/visual/showcase.spec.ts -g "M2 table" --config playwright.showcase.config.ts` | 0 | 单独重跑失败测试：1 passed |
| `python3 scripts/validate_contracts.py` | 2/文件不存在 | 审计技能要求的脚本不在仓库中：`scripts/validate_contracts.py` 不存在；未伪造契约验证结果 |

主应用构建输出：`dist/index.html`、`dist/assets/index-BRMTGQ9C.css`、`dist/assets/index-lQ0VijFJ.js`。

Showcase 构建输出：`dist-showcase/showcase/index.html`、`dist-showcase/assets/index-CzdkId7O.css`、`dist-showcase/assets/index-C6mkSwy8.js`。构建有真实 Rollup 警告：`Some chunks are larger than 500 kB after minification`；退出码仍为 0。

## 未执行项目

- 未执行 `pnpm install`/干净安装；技能要求不在审计中擅自安装依赖。
- 未执行 axe-core。
- 未生成或比较截图基线。
- 未执行真实后端、原 React 基线、权限/API 契约测试。
- 审计技能要求的 `scripts/validate_contracts.py` 因仓库缺少 `scripts/` 目录而无法执行。

## 结论

可运行的静态检查、类型检查、主应用构建、Showcase 构建和结构/隔离脚本均有退出码 0 证据。完整 Showcase 套件首次执行失败、隔离重跑成功，故本报告将该测试标记为 **FLAKY/REQUIRES FOLLOW-UP**，不宣称全套测试无条件通过，也不宣称 F0 或 M2 PASS。
