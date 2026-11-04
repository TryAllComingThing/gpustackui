# Codex 完成定义

按任务适用性执行；不适用的检查必须记录 `NOT EXECUTED`，不得写成 PASS。

## 必须

- `npm run typecheck`
- `npm run lint`
- `npm run check:structure`
- `npm run test:unit`
- 受影响的生产 E2E
- `npm run build`

## 按变更类型追加

- 组件/主题/Showcase：`npm run typecheck:showcase`、`npm run build:showcase`、`npm run test:visual`。
- 无障碍相关：`npm run test:accessibility` 或 `npm run test:strict`。
- API 变更：契约测试、错误路径、401/403 和 Schema 漂移检查。
- 路由/导航：生产 E2E、面包屑、激活态、移动端折叠。
- 发布相关：`npm run quality:check` 与 `npm run quality:release`。

## 交付证据

- 命令、退出码、环境。
- 失败日志、截图、报告路径。
- 修复结果。
- 未执行检查和原因。
- 回滚方式。
