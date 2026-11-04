# GPUStack Vue Framework Baseline

状态：`APPROVED / PENDING CLEAN CANDIDATE COMMIT`

本文件定义一个可复制、可验证、可回滚的内部框架基线，不等同于生产发布承诺。根 `DESIGN.md` 仍是唯一活动设计规范；本文件只记录基线范围、证据和审批状态。

## 基线标识

| 字段 | 值 |
|---|---|
| Baseline ID | `0.2.0-internal-template-baseline` |
| Package version | `0.2.0` |
| 消费形态 | 复制模板（copy template），不是 npm 安装包 |
| 候选提交 | `PENDING`：当前 `HEAD` 为 `d068c4e23dfe4cd93154bbc81a3d8c533eba0888`，工作树未提交，不能作为冻结提交 |
| 基线状态 | `APPROVED`（内部复制模板）；干净候选提交完成前不得打 tag |
| 发布门禁 | `BLOCKED`，以 `docs/quality/QUALITY-GATES.md` 为准 |

## 基线包含

- Vue 3 + TypeScript + Vite 应用骨架，Nuxt UI 4 优先的组件策略与薄 `U*` 适配器。
- `src/app` 路由、导航、访问判断与 Shell；`src/modules/<domain>` 业务切片、公共 `index.ts` 和 `routes.ts`。
- `src/api/<domain>` 领域 API 契约、Zod 响应校验、`src/services/http` 传输与错误归一化。
- HttpOnly Session Cookie 认证契约、`is_admin` 权限模型与 opt-in 路由保护基础设施。
- 单一 `--gp-*` Token 管线、Theme/Density/Typography/Layout manager、五主题与 Showcase 同源组件。
- `docs/ai/` Codex 工作流与任务契约、`planning/` 模板、统一质量门禁和可复现证据。
- 生产构建、Showcase 构建、单元测试、E2E、视觉、无障碍与严格门禁入口。

## 不包含或未启用

- 不代表业务页面已全部迁移或已接入真实后端；GPU 资源页仍使用本地 fixture。
- 认证/权限路由保护仍是 opt-in；登录页、登录回跳和全局 `401` 流程尚未作为生产流程启用。
- 不承诺 npm 安装、库导出或长期兼容 API；`private: true` 保持不变。
- 不承诺生产性能 SLA；主包仍超过 Vite 的 500 KB 警告阈值。
- 不包含正式发布流程；`.github/workflows/release.yml` 仍是禁用占位。
- 自动化 axe/视觉检查不等于人工 WCAG 合规认证。

## 质量证据

最近一次统一门禁记录：

| 项目 | 证据 |
|---|---|
| 命令 | `npm run quality:check` |
| 结果 | `PASS`，16/16 检查通过，0 失败，0 未执行 |
| 运行时间 | `2026-11-04T08:38:02.426663+00:00` → `2026-11-04T08:39:16.374408+00:00` |
| 环境 | macOS-15.2-arm64-arm-64bit；Node `v22.22.0`；npm `11.10.1`；Playwright `1.64.1` |
| 汇总 | `docs/quality/summary.json` |
| 逐项检查 | `docs/quality/checks.json` |
| 报告 | `docs/quality/QUALITY-REPORT.md` |
| 基线评审 | `docs/quality/BASELINE-REVIEW.md` |
| 差异卫生 | `git diff --check`，退出码 `0` |
| 发布门禁 | `BLOCKED`；人工批准已记录，当前阻断项为缺少干净候选提交 |

统一门禁的 `PASS` 只表示当前检查范围内通过；它不能替代人工批准、生产安全配置、人工 WCAG 检查或干净提交验证。

## 已知限制

- 认证 API、auth store、路由 guard 和 `401/403` 仍缺少完整的集成/E2E 证据；启用业务路由保护前必须补齐。
- GPU 设备 API 已冻结但页面未接入；需要单独任务验收 loading、empty、error、分页、排序和权限行为。
- 生产主包约 `648 KB` minified / `207.6 KB` gzip，GPU 页面 chunk 约 `148 KB` / `39.5 KB` gzip；尚无性能预算和回归阈值。
- `src/api/index.ts` 聚合出口存在包体膨胀与跨领域耦合风险，业务代码应优先按领域导入。
- `pr-check.yml` 与 `ci.yml` 职责重叠；`429` 当前映射为 `CONFLICT`，可在后续版本增加独立错误类型。
- 全仓库已跟踪文本文件已完成 LF 归一化，包括 `.codex/skills/` 下 10 个 Skill 文件；归一化变更仍应与功能 diff 分开提交。

## 冻结条件

1. **已完成**：全仓库文本 LF 归一化，包括 `.codex/skills/`；提交时仍应与功能改动拆分。
2. **待完成**：创建干净候选提交，记录完整 SHA，并在该 SHA 上重新执行 `npm run quality:check`。
3. **已完成**：各角色人工批准已记录；P1 项作为内部基线的已接受限制保留，不代表生产就绪。
4. **待完成**：由发布负责人将审批记录绑定干净候选提交 SHA，再更新发布门禁并打 tag。

## 回滚

- 未发布：直接回退候选提交或删除复制出的模板工程；不涉及数据迁移。
- 已复制到业务工程：按 `docs/UPGRADING.md` 的人工 diff 规则保留 `src/modules` 业务实现，回退框架文件与 `package-lock.json`。
- 不得通过删除失败证据或自动接受视觉基线隐藏回归。

## 人工批准记录

批准来源：用户于 2026-11-04 明确确认“各角色均已批准”。未提供个人姓名，因此以“用户确认（各角色）”记录，不虚构审批人。

| 角色 | 批准人 | 日期 | 证据 | 决定 |
|---|---|---|---|---|
| 架构负责人 | 用户确认（各角色） | 2026-11-04 | 本次对话确认；本文件与 `docs/quality/BASELINE-REVIEW.md` | `APPROVED` |
| 安全负责人 | 用户确认（各角色） | 2026-11-04 | 本次对话确认；本文件与 `docs/quality/BASELINE-REVIEW.md` | `APPROVED` |
| 质量/测试负责人 | 用户确认（各角色） | 2026-11-04 | 本次对话确认；本文件与 `docs/quality/BASELINE-REVIEW.md` | `APPROVED` |
| 发布负责人 | 用户确认（各角色） | 2026-11-04 | 本次对话确认；本文件与 `docs/quality/BASELINE-REVIEW.md` | `APPROVED` |

批准范围限于内部复制模板基线。人工 WCAG、人工渗透测试、真实生产反向代理配置、真实 GPUStack 后端联调仍未执行；批准不构成生产发布许可。干净候选提交 SHA 仍是 `PENDING`，因此发布门禁保持 `BLOCKED`。
