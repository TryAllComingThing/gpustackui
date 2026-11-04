# src/modules

按 GPUStack 业务域组织页面、局部状态与 API；不跨模块导入私有实现。

架构：每个 module 组合页面、局部状态和服务调用，经 RouterView 挂载到统一 AppShell。
设计思路：业务域边界优先，共享能力上移 components/patterns，不复制壳层。
设计理念：单一业务职责、API 契约冻结、可独立回滚。
落地路径：页面审计 → API/权限冻结 → 组件迁移 → 状态矩阵 → 构建/浏览器验证。
落地方案：每次只迁移一个域；禁止改变后端契约和跨模块私有导入。详见 `docs/design/DELIVERY-PLAN.md`。
