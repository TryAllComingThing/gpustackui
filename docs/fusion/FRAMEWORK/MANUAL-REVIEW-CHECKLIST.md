# 框架治理人工复核清单

以下项目必须由责任人人工确认，自动化校验不能替代。未完成项保持 `REVIEW`，不能写成 `APPROVED`。

| 复核项 | 责任角色 | 当前状态 | 复核问题 | 证据 |
|---|---|---|---|---|
| 根目录唯一 DESIGN.md | 架构 + 设计 | REVIEW | 是否接受根 DESIGN.md 作为唯一活动权威？归档文件是否只读？ | `DESIGN.md`; `FROZEN-SOURCES.csv` |
| 默认主题契约 | 设计 + 产品 | REVIEW | 是否确认 standard/business/future 是默认公开 ID，sky/ocean 仅为兼容扩展？ | `DESIGN.md`; `THEME-CONTRACT.md` |
| 受控布局配置 | 架构 + 产品 | REVIEW | Header 60、Sidebar 200/64、Breadcrumb Header 的默认值和可配置边界是否被接受？ | `DESIGN.md`; `FUSION-MATRIX.csv` |
| Radius 扩展 | 设计 + 产品 + 架构 | PROPOSED | 是否需要主题化 Radius？如果需要，canonical values 和迁移范围是什么？ | `VISUAL-EXTENSION-REGISTER.csv` VE-001 |
| Shadow 扩展 | 设计 + 架构 | PENDING | 是否批准结构化 elevation scale 及其来源编译方式？ | VE-002 |
| Motion 扩展 | 设计 + QA | PROPOSED | 是否批准新的标准/浮层时长，及 reduced-motion 行为？ | VE-003 |
| Icon 契约 | 设计 + 架构 + 无障碍 | PROPOSED | 是否批准 Icon family、线宽、尺寸和语义名称集合？ | VE-004 |
| DataViz 色板 | 设计 + 产品 + QA | PROPOSED | 是否批准六类色板具体值及非颜色替代表达？ | VE-005 |
| 生产 Modal/Drawer | 架构 + 产品 + QA + 无障碍 | PENDING-PRODUCTION | 是否指定生产源码目标、owner、路由范围和焦点契约？ | `PRODUCTION-OVERLAY-REGISTER.csv` |
| API/权限边界 | 产品 + 迁移负责人 + 架构 | DEFERRED | 是否确认业务 API、权限和状态机继续按迁移清单处理？ | `docs/migration/BUSINESS-CONTRACT.md` |
| 质量豁免范围 | QA + 无障碍 + 架构 | APPROVED-SCOPE | 是否确认 axe-core、Firefox/WebKit、截图基线审批和人工 WCAG 永久 EXEMPT？ | `AGENTS.md`; `design-system/qa/ACCEPTANCE_CHECKLIST.csv` |

复核完成后，责任人应在对应 ADR 或本表填写姓名、角色、日期、批准范围和限制；没有这些信息不得将 PROPOSED/PENDING 改成 APPROVED。
