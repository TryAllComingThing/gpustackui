# GPUStack 示例

本目录只包含 GPUStack 专用的 GPU 资源页面和路由，默认关闭。需要 `/resources/gpus` 示例时设置 `VITE_ENABLE_GPUSTACK_EXAMPLE=true`；E2E 通过 `.env.e2e` 显式启用。

通用项目保持 `VITE_ENABLE_GPUSTACK_EXAMPLE=false`，并通过 `VITE_APP_NAME` 配置产品名称。关闭后示例路由不会注册。

后端契约仍由兼容路径 `src/api/resources/gpu-device.ts` 提供，保持 `GET /v2/gpu-devices` 与 `GET /v2/gpu-devices/{id}` 不变。
