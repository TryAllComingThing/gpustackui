# F5 变更清单与初步测试

## 变更文件

- `showcase/main.ts`：初始化 F2/F3 Density、Typography、Layout manager。
- `showcase/App.vue`：升级 Showcase IA，增加 Density 控制、Tokens/Components/States/Patterns/Accessibility/Quality 区块。
- `showcase/showcase.css`：增加 IA 导航、质量契约区块和响应式布局样式。
- `tests/visual/showcase.spec.ts`：增加 IA 区块和 Density 控件存在性断言。
- `docs/DESIGN-TRACEABILITY.csv`：新增规范到源码/测试追踪矩阵。
- `docs/fusion/F5/F5-SHOWCASE-AUDIT.md`：新增 REUSE/MODIFY/REMOVE/DEFER 审计。

## 初步检查

修改后应执行：

```text
pnpm typecheck:showcase
pnpm build:showcase
pnpm test:showcase
pnpm check:showcase-isolation
git diff --check
```

最终状态必须以实际退出码为准，不由本文件预先宣称 PASS。

初步验证结果：`pnpm typecheck:showcase`、`pnpm build:showcase`、`pnpm test:showcase`、`pnpm test:strict`、`pnpm check:showcase-isolation` 和 `git diff --check` 均实际退出码 0。信息架构接入真实 manager 后视觉基线发生预期变化，已重新生成 Chromium/Firefox/WebKit 快照并通过严格比对。
