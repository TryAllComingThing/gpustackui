# Showcase 无障碍验收记录

验收入口：`playwright.accessibility.config.ts`，页面使用本地 fixtures，不调用后端。

自动化覆盖：

- `banner`、`main`、`navigation` landmark 可见且有名称；
- Breadcrumb `aria-label="当前位置"` 和唯一 `aria-current="page"`；
- 主题、表格、输入框、选择框和 API 地址控件具备可访问名称；
- 键盘聚焦导航项，Enter 触发选中状态；
- Modal 打开、对话框关闭按钮和 Escape 关闭；
- 五主题均提供 focus、success、warning、danger 语义 Token。

实际命令：

```text
pnpm test:accessibility
退出码：0
结果：2 tests passed
```

这份结果证明 Showcase 的语义和键盘验收通过，不等同于 axe-core 零严重问题、Firefox/WebKit 通过或人工 WCAG 2.2 AA 签审；这些项目仍需独立执行并保留日志。
