# Vue 3 SaaS Framework Fusion Records

本目录记录从 SaaS V1.1 与既有 GPUStack Vue 视觉资产融合到通用 Vue 3 SaaS 框架的文档证据。

- `FROZEN-SOURCES.csv`：原始双层 DESIGN.md、Token Schema 和矩阵的冻结哈希；
- `SOURCE-INVENTORY.csv`：来源、目标、关系和状态清单；
- `FUSION-MATRIX.csv`：主题、Token、Typography、Density、Layout、组件、交互、图表、无障碍、Showcase 和治理融合矩阵；
- `TOKEN-SOURCE-MAP.csv`：Token 到真实源码的映射；
- `COMPONENT-SOURCE-MAP.csv`：组件契约、生产源码、Showcase 和测试映射。
- `PRODUCTION-OVERLAY-REGISTER.csv`：生产 Modal/Drawer 等尚未有源码目标的组件登记。
- `VISUAL-EXTENSION-REGISTER.csv`：未批准视觉扩展及其状态。
- `VISUAL-EXTENSION-APPROVAL.md`、`ADR-TEMPLATE.md`：视觉扩展批准流程和 ADR 模板。
- `MANUAL-REVIEW-CHECKLIST.md`：需要设计、产品、架构、QA、无障碍责任人确认的治理事项。

根目录 `DESIGN.md` 是唯一活动设计规范。旧版通用和项目 DESIGN.md 保存在 `docs/fusion/archive/`，仅用于追溯，不作为活动权威。

本轮只修改文档和契约。未审批扩展使用 `PROPOSED`、`PENDING` 或 `DEFERRED`；不能由文档自动推导实现已完成。
