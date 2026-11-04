# Codex 变更 allowlist

## 默认允许

- 任务明确列出的 `src/modules/<domain>/` 文件。
- 对应 `src/api/<domain>/` 契约文件。
- 必要的 `src/components/` 公共组件。
- 对应 `tests/` 和 `showcase/` 文件。
- 任务要求的文档、i18n 和路由注册。

## 默认禁止

- 未列入任务的模块、页面或 API。
- 修改既有后端契约、权限或认证语义。
- 修改生成主题 CSS 而不改 Token 源。
- 创建 `src/components/ui/`、第二套设计系统或平行 `--ds-*` 变量。
- 自动更新视觉基线或删除失败证据。

## 例外

任何例外必须写入任务契约，说明原因、影响范围、回滚方式和人工批准记录。
