# src/modules

按业务域组织页面、路由、局部状态和私有 UI；不跨模块导入私有实现。可选 GPUStack 示例隔离在 `resources/examples/gpustack/`。

资源、模型、部署和服务目录当前是本地 fixtures 演示层，默认不注册路由。设置 `VITE_ENABLE_DEMO_MODULES=false` 时，生产应用只保留 Dashboard 与 Settings 框架壳层；接入真实业务前，先在 `src/api/<domain>/` 定义已确认的后端契约，再替换页面数据源。不得把 fixture 响应函数包装成虚构 API。

架构：每个 module 至少包含 `pages/`、`routes.ts` 和公共 `index.ts`；需要时增加私有 `components/`、`composables/`、`types.ts`。后端契约统一放在 `src/api/<domain>/`，跨模块公共 UI 上移到 `src/components/`。
设计思路：业务域边界优先；模块只消费自己的 API 与公共组件，不复制壳层或其他模块私有实现。
设计理念：单一业务职责、API 契约稳定、公共 UI 可复用、模块边界清晰。
落地路径：页面审计 → API/权限确认 → 模块切片 → 组件迁移 → 状态矩阵 → 构建与浏览器测试。
落地方案：每次只迁移一个域；禁止改变后端契约和跨模块私有导入。详见 `docs/design/FRAMEWORK-GUIDE.md`。
