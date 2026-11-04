# src/theme

主题 Token、五主题 CSS、三密度运行时、切换与持久化；不包含 UI 组件和业务逻辑。

架构：`tokens/` 是唯一源，`styles/themes/*.css` 由脚本生成，四个 manager 分别写入 `data-theme`、`data-density`、`data-typography` 和 layout 变量。
设计思路：Primitive → Semantic → Component → Compatibility 单向链路，Nuxt UI 经 bridge 消费 `--gp-*`。
设计理念：单一事实来源、Theme/Density 正交、兼容可逆、证据驱动。
落地路径：Token 设计/审批 → 生成 CSS → manager 接入 → 五主题/三密度验证。
落地方案：不手改生成文件，不新增 `--ds-*`；本次兼容推荐值已获人工批准并落地，后续变更仍先审批后落值。详见 `docs/design/TOKEN-MAPPING.md`。
