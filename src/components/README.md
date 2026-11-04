# src/components

通用、业务无关组件；优先复用 Nuxt UI，仅在必要时增加适配层。

架构：`common/` 放薄 `U*` 适配器，`patterns/` 放跨页面组合，页面默认直接使用 Nuxt UI 原语。
设计思路：跨页面状态、递归装饰、无障碍或稳定 DOM 契约才建 adapter；`UBreadcrumb` 内部显式绑定 Nuxt 原语。
设计理念：最小适配、状态完整、可访问性内建、生产与 Showcase 同源。
落地路径：决策树判断 → 组件实现 → 状态矩阵 → 构建/浏览器证据。
落地方案：禁止旧组件前缀命名、纯 prop 透传和页面级平行实现。详见 `docs/design/COMPONENT-MATRIX.md`。
