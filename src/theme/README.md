# src/theme

主题 Token、五主题 CSS、三密度与三种外观运行时、切换与持久化；不包含 UI 组件和业务逻辑。

架构：`tokens/` 是唯一源，`styles/themes/*.css` 由脚本生成；Theme、Density、Appearance、Typography、Layout manager 分别写入 `data-theme`、`data-density`、`data-appearance`、`data-typography` 和 layout 变量。
设计思路：Primitive → Semantic → Component → Compatibility 单向链路，Nuxt UI 经 bridge 消费 `--gp-*`。
设计理念：单一事实来源、Theme/Density/Appearance 正交、兼容 alias 单向映射。
落地路径：Token 设计 → 生成 CSS → manager 接入 → 五主题/三密度/三外观测试。
落地方案：不手改生成文件，不新增 `--ds-*`；兼容值以源 JSON 和映射表为准。详见 `docs/design/TOKEN-MAPPING.md`。
