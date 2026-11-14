# Codex 评审清单

- [ ] 目标、非目标和完成条件一致。
- [ ] 已声明 L1/L2/L3，且高风险变更未降级。
- [ ] 已检索现有组件、Composable、Utils、Service，并说明复用/扩展/新增依据。
- [ ] 变更范围聚焦，没有无关重构。
- [ ] API、权限、认证和路由语义未被静默改变。
- [ ] API 契约与 `src/api/<domain>/` 一致，响应经过 Schema 校验。
- [ ] 模块只通过公共 `index.ts` 暴露能力。
- [ ] 跨模块公共 UI 在 `src/components/`，私有 UI 在模块内。
- [ ] 使用 `--gp-*`、`data-theme`、`data-density`、`data-appearance`，没有硬编码主题 HEX 或平行外观主题。
- [ ] 生成主题 CSS 来自 Token 源，没有手工漂移。
- [ ] i18n key 在中英文资源中成对存在。
- [ ] loading、empty、error、retry、disabled 状态完整。
- [ ] 键盘、焦点、可访问名称和状态播报未被破坏。
- [ ] 相关测试和构建已运行，交付说明与实际结果一致。
- [ ] 文档、路由、导航和测试已同步。
