# Codex 评审清单

- [ ] 目标、非目标和验收标准一致。
- [ ] 没有修改 allowlist 之外的文件。
- [ ] API、权限、认证和路由语义未被静默改变。
- [ ] API 契约与 `src/api/<domain>/` 一致。
- [ ] 模块只通过公共 `index.ts` 暴露能力。
- [ ] 跨模块公共 UI 在 `src/components/`，私有 UI 在模块内。
- [ ] 使用 `--gp-*`、`data-theme`、`data-density`，没有硬编码主题 HEX。
- [ ] i18n key 在中英文资源中成对存在。
- [ ] loading、empty、error、retry、disabled 状态完整。
- [ ] 键盘、焦点、可访问名称和状态播报未被破坏。
- [ ] 测试和构建有真实退出码。
- [ ] 文档、路由、导航和测试证据已同步。
