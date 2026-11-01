# 五主题 Token 验证记录

实现范围：`standard`、`business`、`future`、`sky`、`ocean`。每个主题均加载完整 Brand、Success、Warning、Danger、Info、Text、Line、Background 语义 Token，公共 Alpha Token 保留在 `src/theme/styles/tokens.css`。

设计源与运行时结果：

- A2 → `business`，D → `future`，E → `standard`。
- B → `sky`，C → `ocean`。
- 运行时入口仅使用 `--gp-*`；未新增 `--ds-*` 业务接口。

验证命令和结果以本次执行日志为准：

| 命令 | 结果 |
|---|---|
| `python3 scripts/validate_contracts.py` | 退出码 0；契约、五主题 parity、运行时命名空间和门禁脚本检查通过 |
| `pnpm typecheck` | 退出码 0 |
| `pnpm build` | 退出码 0 |
| `pnpm typecheck:showcase` | 退出码 0 |
| `pnpm build:showcase` | 退出码 0；最大 JavaScript chunk 约 455 kB，无 >500 kB 或 circular chunk 警告 |
| `pnpm test:showcase` | 退出码 0；2 tests passed |
| `pnpm test:unit` | 退出码 0；1 file / 4 tests passed |
| `pnpm test:accessibility` | 退出码 0；2 tests passed，覆盖 landmarks、accessible names、Breadcrumb、键盘、Modal Escape 和五主题状态色 |
| `pnpm check:showcase-isolation` | 退出码 0 |
| `pnpm lint` | 退出码 0 |

脚本补充：`scripts/validate_contracts.py` 校验 `.codex/skills/gpustack-design-system/contract.json`、四项设计输出、五主题 JSON/CSS 键值 parity、`theme.registry.ts` 映射、`main.css` 导入、`--gp-*` 运行时命名空间和 package gate 脚本。该脚本不修改文件，也不会替代人工设计审批或 axe/跨浏览器验收。

Showcase 使用 Rollup `manualChunks` 拆分 Vue、Nuxt UI 和 Reka UI 依赖；最近一次 `pnpm build:showcase` 输出的最大 JavaScript chunk 为约 470 kB，未出现 >500 kB 或 circular chunk 警告。

以上命令均已执行并记录退出码。五主题 Token、单元测试、语义/键盘无障碍和工程门禁达到自动化检查要求；ADR 索引中的审批状态和 axe/Firefox/WebKit/人工无障碍评审仍需独立处理。
