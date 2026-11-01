# quality

质量资产与统一门禁入口；不得伪造 PASS。

## Unified entry

运行：

```text
pnpm quality:check
```

入口 `scripts/quality_check.py` 按以下顺序执行真实命令：

1. Static：契约、Skill、目录结构、类型、Lint、F2/F3 Token 和 diff 检查；
2. Build：生产和 Showcase 构建；
3. Functional：单元、生产 E2E、Showcase；
4. Visual：Showcase 视觉回归；
5. Accessibility：语义/键盘、axe-core、Chromium/Firefox/WebKit、视觉严格门禁和 Showcase 隔离；
6. Release Decision：检查失败、未执行、证据缺失或未关闭缺陷时写入 `BLOCKED`，否则才可能写入 `PASS`。

输出目录：

- `docs/quality/summary.json`：环境、耗时、分类、release decision 和阻断原因；
- `docs/quality/checks.json`：每项命令、退出码、耗时、状态和证据路径；
- `docs/quality/defects.csv`：未关闭缺陷；
- `docs/quality/evidence/`：每项命令的完整 stdout/stderr 日志；
- `docs/quality/QUALITY-REPORT.md`：人类可读报告。

既有 `typecheck`、`build`、`test:*`、`check:*` 和 `validate:*` 命令保持兼容，可独立运行；统一入口不会替代这些命令。
