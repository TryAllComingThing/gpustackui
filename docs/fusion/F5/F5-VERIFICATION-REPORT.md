# F5 通用用户管理验收闭环报告

状态：**VERIFIED**。

本次开发只扩展独立 Showcase 验收入口，不接入 GPU 业务接口。用户管理页面复用 F4 `DataTablePattern`、`ComplexFormPattern`、`DrpModal`、Nuxt UI 原语，以及 F2/F3 Theme、Density、Typography、Layout managers。

## 页面覆盖

- 列表：本地 `showcase/fixtures/users.ts` 模拟用户资源。
- 搜索：姓名、邮箱、角色。
- 筛选：角色、启用状态。
- 排序：表格列排序。
- 分页：`DrpDataTable` / `UPagination`。
- 新增弹窗：`DrpModal`。
- Zod：必填、邮箱、密码长度、跨字段确认密码规则。
- 状态：Loading、Empty、Error、Retry、Success。
- 主题密度：五主题 × compact/standard/comfortable。

## 实际执行

统一入口：`pnpm quality:check`

结果：`release_decision=PASS`，18 项检查全部退出码 0，无未执行检查、无缺失证据、无开放缺陷。

完整命令、退出码、耗时、环境和证据路径见：

- `docs/quality/summary.json`
- `docs/quality/checks.json`
- `docs/quality/evidence/`
- `docs/quality/QUALITY-REPORT.md`

严格门禁 `pnpm test:strict` 覆盖 Chromium、Firefox、WebKit、axe-core、键盘、状态、五主题三密度和视觉快照，共 12 项通过。

## 失败与整改

1. 初次 Showcase 测试中用户 Modal wrapper 的 `data-testid` 不在最终 portal DOM，且密码和新增用户名定位器不唯一；修正为 Nuxt UI `role=dialog`、精确字段名称和表格 cell 定位后，`pnpm test:showcase` 退出码 0。
2. 初次严格 axe-core 扫描发现 DataTablePattern 的分页 landmark 重复；为 Pattern 增加可配置 `ariaLabel`，用户管理使用唯一 label，并将分页 label 从 Pattern label 派生；整改后 Chromium/Firefox/WebKit axe-core 均退出码 0。

## 证据资产

- 代码 Diff：[F5-CODE-DIFF.patch](./F5-CODE-DIFF.patch)
- 执行记录：[F5-EXECUTION-RECORD.json](./F5-EXECUTION-RECORD.json)
- 截图清单：[F5-SCREENSHOTS.txt](./F5-SCREENSHOTS.txt)
- 缺陷清单：[F5-DEFECTS.csv](./F5-DEFECTS.csv)
- 设计追踪：[../../DESIGN-TRACEABILITY.csv](../../DESIGN-TRACEABILITY.csv)

## 结论

P0/P1 缺陷全部关闭，统一 quality gate 返回 PASS，F5 标记为 VERIFIED。
