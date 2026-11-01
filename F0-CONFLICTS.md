# F0 冲突与风险

## 已确认冲突

1. **工作树与 HEAD 不同**：HEAD 是 `d2e3309…`，但当前工作树包含 M2-04 的 Showcase、Drp 组件、主题适配、生成声明和删除/重命名的 `.DS_Store`。任何基于工作树的结论都不能直接当作 HEAD 已提交能力。
2. **设计文档状态滞后**：`DESIGN.md:3` 仍写“真实项目接入、Nuxt UI 版本兼容及浏览器测试尚未执行”，但当前工作树已实际执行并通过多项检查；该描述应由后续文档维护者更新，不能作为测试证据。
3. **双锁文件**：`package-lock.json` 与 `pnpm-lock.yaml` 同时存在。`package.json:5` 指定 pnpm，实际命令使用 pnpm；npm/pnpm 安装策略未统一。
4. **历史环境记录不一致**：`M2-LOCAL-CHECKS.json:9` 记录 Node `v22.16.0`，本次审计环境为 `v22.22.0`。该 JSON 不是本次执行日志。
5. **Showcase 与生产 Header 约束存在范围差异**：DESIGN.md:5、末尾 BC 约束要求面包屑在 Header；当前 Showcase 在 `showcase/App.vue:184-187` 将 DrpBreadcrumb 放在导航内容卡中，生产 `src/App.vue` 也没有 AppShell/Header。Showcase 的面包屑可验证，但 Header 合规仍 OPEN。

## 质量脚本限制

- `quality/check_showcase_isolation.py:3-12` 只扫描 `dist` 中四个字符串标记，输出中也写明“review imports separately”；它不能证明完整的依赖图隔离。
- `quality/check_structure.py:4-8` 只检查路径存在，不检查内容、API 契约、生产路由或安全边界。
- `tests/visual/showcase.spec.ts` 的完整套件本次第一次执行为：第一测试通过、第二测试在 USelect “空状态” option 等待处超时；单独重跑第二测试返回 0。该波动应继续调查，不能改写为无条件稳定通过。

## 未知项

- 原 React 2.3.0 源码、真实业务路由、API、权限和数据契约不在当前仓库可审计范围内；`docs/migration/BUSINESS-CONTRACT.md` 仍为待补齐。
- 生产 Header、路由级面包屑和真实业务模块尚未实现，因此不能根据 Showcase 通过推断业务等价。
- axe-core、截图基线和真实 1440/1024/390 全矩阵报告本次未执行。

## 建议优先级

P1：统一 lockfile/安装策略；补齐生产路由、Header/AppShell、业务/API/权限契约；将 Showcase 失败的 USelect 测试波动固定为可重复证据。

P2：加强 isolation 检查为依赖/入口图审计；执行 axe-core 和三视口截图基线；同步 DESIGN.md 状态文本。
