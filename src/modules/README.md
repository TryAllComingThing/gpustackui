# src/modules

按 GPUStack 业务域组织页面、路由、局部状态和私有 UI；不跨模块导入私有实现。

架构：每个 module 至少包含 `pages/`、`routes.ts` 和公共 `index.ts`；需要时增加私有 `components/`、`composables/`、`types.ts`。后端契约统一放在 `src/api/<domain>/`，跨模块公共 UI 上移到 `src/components/`。
设计思路：业务域边界优先；模块只消费自己的 API 与公共组件，不复制壳层或其他模块私有实现。
设计理念：单一业务职责、API 契约冻结、公共 UI 可复用、可独立回滚。
落地路径：页面审计 → API/权限冻结 → 模块切片 → 组件迁移 → 状态矩阵 → 构建/浏览器验证。
落地方案：每次只迁移一个域；禁止改变后端契约和跨模块私有导入。详见 `docs/design/DELIVERY-PLAN.md`。
