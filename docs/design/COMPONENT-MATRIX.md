# 通用 Vue 3 SaaS 组件契约

组件契约源为 `design-system/contracts/COMPONENT_MATRIX.csv`，源码和测试映射见 `docs/fusion/FRAMEWORK/COMPONENT-SOURCE-MAP.csv`。矩阵登记适用状态和验收要求，不代表每个组件已经在生产页面实现。

框架默认使用 Nuxt UI 原语；仅为跨页面行为保留 `DrpDataTable`、`DrpSidebarNav`、`DrpBreadcrumb` 等薄适配。业务组件不得复制基础原语。

状态按适用性覆盖 default、hover、pressed、focus-visible、selected、disabled、readonly、loading、error、success、empty。永久豁免 axe-core、Firefox/WebKit、截图基线审批和人工 WCAG 评审，其他自动化证据必须记录退出码。

Modal 和 Drawer 已完成通用契约登记，但当前没有生产业务源码目标；登记状态、owner 和所需焦点证据见 `docs/fusion/FRAMEWORK/PRODUCTION-OVERLAY-REGISTER.csv`，不能从 Showcase UModal 通过推导生产组件已完成。
