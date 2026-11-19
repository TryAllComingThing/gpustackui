# HTML 原型实现评审记录

- 变更 ID：`admin-foundation/prototype-review`
- 状态：`AUTOMATED PASS / OWNER CONFIRMATION PENDING`
- 日期：2026-11-15
- 关联：`prototypes/admin-foundation/`、`shortest-path-execution.md`、`MANUAL-12`
- 说明：本记录不新增多角色签收、版本号或独立证据包；只记录实现评审所需的最小证据。

## 1. 评审范围

- 机构树：展开/收起、键盘左右键、筛选、空/错误/403/404/409/412 状态。
- 创建/编辑 Drawer：Escape 关闭、焦点恢复。
- 移动与启停对话框：键盘关闭、409 状态可见。
- 权限矩阵：分组 indeterminate、变更摘要、受保护权限。
- 公告：已发布不可原地修改、撤回确认、预览快照。
- 审计：只读详情、复制 `request_id`、无导出/删除入口。
- 主题/密度/外观切换；320px 窄屏。

## 2. 自动验收

命令：

```text
node planning/admin-foundation/prototypes/admin-foundation/verify.mjs
```

结果：`ok: true`。

覆盖：

- theme/density/appearance runtime
- tree keyboard expand/collapse
- drawer Escape and focus restore
- move dialog keyboard close
- 409 state banner
- permission matrix change summary
- announcement withdraw confirmation
- audit read-only boundary
- 320px horizontal overflow
- axe WCAG 2 A/AA desktop and 320px

## 3. 截图检查

- `/tmp/admin-foundation-prototype-desktop.png`：桌面机构树、筛选、状态和操作入口完整。
- `/tmp/admin-foundation-prototype-roles.png`：权限矩阵与变更摘要可见。
- `/tmp/admin-foundation-prototype-announcements.png`：公告撤回确认和状态变化可见。
- `/tmp/admin-foundation-prototype-audit.png`：审计只读边界可见。
- `/tmp/admin-foundation-prototype-320.png`：320px 下表格转为堆叠布局，无页面级横向滚动；操作入口仍可见。

目视检查未发现阻断性问题。状态不仅有颜色，还保留文字标签。

## 4. 待确认项

- [ ] 实现评审负责人确认本记录和截图。
- [ ] 实现后执行代码级键盘、窄屏、屏幕阅读器和减少动画验收。
- [ ] 若设计系统 Token 或布局约束变化，重新运行 `verify.mjs`。

## 5. 当前结论

`AUTOMATED PASS / OWNER CONFIRMATION PENDING`。G4 尚未最终关闭，但自动化证据和截图检查已就绪；按 `MANUAL-12` 不需要额外多角色签批、版本号或独立证据包。
