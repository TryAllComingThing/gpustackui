# Codex 任务分级

每个进入实现的任务先声明 `taskLevel`。发现高风险后应升级，不得降级绕过检查。

## 分级规则

| 级别 | 适用变更 | 建议审阅 | 最低检查 |
|---|---|---|---|
| L1 | 单文件文案、注释、局部样式、无行为变化的文档修正 | 自检与一次代码审阅 | `typecheck` 或受影响的文档/脚本检查 |
| L2 | 单模块页面/组件、公共组件的兼容扩展、测试或脚本增强 | 代码审阅与受影响路径审查 | `typecheck`、`lint`、`test:unit`、受影响的 E2E 或 Showcase 检查 |
| L3 | 认证/权限/路由语义、API 契约、主题 Token、跨模块公共能力、模块生成器 | 代码审阅与安全/架构审查 | `typecheck`、`lint`、`test:unit`、受影响 E2E；按变更追加 showcase/accessibility/build |

## 必须升级为 L3 的变更

- 修改 `src/services/auth/**`、`src/services/http/**`、`src/stores/auth.ts`、`src/app/router/**`、API 契约或权限判断。
- 修改 `src/theme/tokens/**`、生成主题链路或 `src/components/common/**` 的跨页面行为。
- 修改模块生成器、公共构建配置或影响两个以上业务模块。
- 数据迁移、破坏性公共 API 变更或不可逆配置变更。

## 记录要求

- 交付说明记录任务级别、修改范围、已执行命令和未执行项。
- 未执行的检查说明原因，不描述为通过。
- L3 变更保留关键失败日志和修复说明，便于后续评审。
