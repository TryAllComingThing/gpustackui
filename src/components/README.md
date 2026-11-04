# src/components

跨模块公共组件；优先复用 Nuxt UI，仅在必要时增加适配层。

架构：`common/` 放薄 `U*` 适配器，`feedback/` 放空/错/加载状态，`layout/` 放壳层，`patterns/` 放跨页面组合；页面默认直接使用 Nuxt UI 原语。
设计思路：只有被两个以上模块复用、或承载跨页面状态/无障碍/DOM 契约的组件才上移；模块私有组件留在 `modules/<domain>/components/`。
设计理念：最小适配、状态完整、可访问性内建、生产与 Showcase 同源。
落地路径：复用范围判断 → 组件实现 → 状态矩阵 → 构建/浏览器证据。
落地方案：禁止 `components/ui/` 平行原语层、纯 prop 透传和页面级平行实现。详见 `docs/design/COMPONENT-MATRIX.md`。
