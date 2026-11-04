# src/composables

通用 Vue 组合函数，不存放特定业务流程。

架构：composable 连接组件与浏览器/状态能力，不进入主题源和页面路由。
设计思路：纯逻辑优先、副作用显式、SSR/无 DOM 环境安全。
设计理念：可测试、可逆、最小耦合。
落地路径：API 设计 → 单测/类型检查 → 页面接入。
落地方案：跨模块复用前先确认不是页面私有逻辑。详见 `docs/architecture/ARCHITECTURE.md`。
