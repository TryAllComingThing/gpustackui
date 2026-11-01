# 视觉扩展批准流程

视觉扩展包括主题化 Radius、结构化 Shadow、Motion 时长分级、Icon family/线宽、DataViz 色板，以及任何新的 Surface/Spacing/Layout 值。它们不能因为存在 SaaS 上游建议就直接进入 runtime。

## 状态

`DRAFT` → `PROPOSED` → `REVIEW` → `APPROVED` 或 `REJECTED`；暂不实施的项目使用 `DEFERRED`。只有 `APPROVED` 才能写入 Token Schema、生成 `--gp-*` 或进入组件契约默认值。

## 必填材料

1. 唯一编号和扩展领域；
2. SaaS 来源路径、既有框架来源路径和实际冲突；
3. Primitive、Semantic、Component Token 变化；
4. 影响主题、Density、布局、组件状态和兼容别名；
5. 受影响源码路径和回滚方式；
6. 自动化验证命令、退出码、计算样式或键盘证据；
7. 是否需要 API、权限或后端契约变化；如需要必须转迁移评审；
8. 未执行项目必须明确写 `NOT RUN` 或 `EXEMPT`。

## 审批角色

- 设计：确认视觉语义、层级、状态和跨主题一致性；
- 产品：确认默认行为、主题范围和用户影响；
- 架构：确认 Token 层级、兼容别名、runtime namespace 和回滚；
- QA：确认命令、退出码、测试范围和缺陷等级；
- 无障碍：确认语义、键盘、焦点和状态播报。项目永久豁免 axe-core、Firefox/WebKit、截图基线审批和人工 WCAG 评审，这些项目必须记录为 `EXEMPT`，不得冒充批准证据。

批准记录必须包含批准人、角色、日期、批准范围和限制。当前小张于 2026-11-01 的批准覆盖 F1 已记录的设计决策，不自动覆盖本文件中新提出的视觉扩展。
