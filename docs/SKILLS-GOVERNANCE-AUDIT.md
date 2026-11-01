# Skills / AGENTS / Quality 治理审计

状态：REVISE。五个 Skill 已统一契约并通过结构、路径和真实调用校验；本次没有执行完整生产/跨浏览器测试矩阵。

## 五个 Skill 结果

| Skill | 保留职责 | 统一修改 | 结构/路径检查 | 真实调用 |
|---|---|---|---:|---:|
| `gpustack-design-system` | Token、Theme、组件和证据门禁 | 唯一根 DESIGN.md、Nuxt UI/F4 复用、Theme/Density manager、Showcase 和质量报告 | 0 | `python3 scripts/validate_skills.py --skill design-system`：0 |
| `gpustack-page-migration` | 单页 API/行为保真迁移 | 唯一设计权威、公共组件复用、业务 API/权限保护、真实报告 | 0 | `python3 scripts/validate_skills.py --skill page-migration`：0 |
| `gpustack-visual-qa` | 多主题视觉和无障碍验证 | 真实 Theme/Density、共享组件、axe/浏览器/快照证据规则 | 0 | `python3 scripts/validate_skills.py --skill visual-qa`：0 |
| `gpustack-repo-audit` | 存量工程审计 | 唯一 DESIGN.md、REUSE/MODIFY/REMOVE/DEFER、未知项和证据路径 | 0 | `python3 scripts/validate_skills.py --skill repo-audit`：0 |
| `gpustack-release-gate` | 构建、测试、安全、主题和回滚门禁 | 唯一 DESIGN.md、共享实现、Showcase 隔离、gate/state 和受保护 CI 规则 | 0 | `python3 scripts/validate_skills.py --skill release-gate`：0 |

## AGENTS.md 修订

- 移除过期的永久 axe/Firefox/WebKit/截图/WCAG 豁免表述；改为按任务要求执行或记录 `NOT EXECUTED`。
- 移除双层设计权威和 GPU Profile 假设。
- 明确 Nuxt UI 优先、Drp 薄适配、`--gp-*`、`data-theme`、`data-density` 和 Showcase 隔离契约。
- 明确 BLOCKED/REVISE/PASS 条件和报告证据要求。

## 真实执行命令

| 命令 | 退出码 | 结果 |
|---|---:|---|
| `pnpm validate:skills` | 0 | 五个 Skill 结构和路径检查 |
| 每个 `python3 scripts/validate_skills.py --skill <name>` | 0 | 五个独立真实调用 |
| `python3 scripts/validate_contracts.py` | 0 | 设计契约、五主题和运行时命名空间 |
| `pnpm typecheck:showcase` | 0 | Showcase/共享组件类型检查 |
| `pnpm check:showcase-isolation` | 0 | Showcase 生产隔离检查 |
| `git diff --check` | 0 | 差异格式检查 |

未在本轮重复执行的项目：完整生产构建、生产 E2E、完整 Showcase、axe-core、Firefox/WebKit、截图回归和单元测试。它们不在本报告中宣称通过；F4 已有独立真实证据，但不自动替代本轮执行。
