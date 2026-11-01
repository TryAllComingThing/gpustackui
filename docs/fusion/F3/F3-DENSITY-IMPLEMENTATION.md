# F3 Density Engine 与基础视觉接入

状态：**REVIEW**

## 实现

- `src/theme/density.manager.ts` 校验并持久化 `compact`、`standard`、`comfortable`，只写 `data-density`；不会读取或修改 `data-theme`。
- `src/theme/styles/tokens.css` 通过三个 `data-density` 选择器覆盖控件高度、表格行高、卡片内边距、字段/区块/筛选间距和内容内边距。
- `src/theme/typography.manager.ts` 与 `typography.json` 保持九级语义；CSS 提供首屏 numeric/code fallback。
- `src/theme/layout.manager.ts` 提供受控布局配置入口，默认 Header `60px`、Sidebar `200px/64px`、Breadcrumb `header`；仅接受正像素值，不改变组件公共 API。
- `tokens.css`、`layout.css`、`typography.css`、`components.css` 使用统一 `--gp-*` Token；旧变量继续指向 `--gp-*`。
- Surface、Radius、Shadow、Motion、Icon 继续使用既有语义和兼容变量；未批准变体没有写入生成器或主题 CSS。

## 正交性

Density manager 只操作 `document.documentElement.dataset.density`，Theme manager 只操作 `dataset.theme`。两者使用独立 localStorage key（`gpustack-density`/`gpustack-theme`），切换一方不会覆盖另一方。布局 manager 只设置受控 geometry CSS variables，不改变主题或密度属性。

## 修改文件与风险

| 文件 | 改动 | 兼容性风险 |
|---|---|---|
| `src/theme/layout.manager.ts` | 新增受控布局配置与校验 | 调用方若传入非 px 值会回退默认值；不支持任意 CSS 表达式 |
| `src/main.ts` | 初始化布局默认值 | 根元素内联变量优先于 CSS；只覆盖批准的几何 Token |
| `src/theme/styles/tokens.css` | 增加空间 40/48、布局别名 | 40/48 仅作为基础网格别名，不代表新增密度档 |
| `src/theme/styles/layout.css` | 基础 Header/Card/Grid 间距改用 Token | 局部页面依赖旧固定值时，结果由 Density 影响；旧变量未删除 |
| `src/theme/styles/typography.css` | 表格 padding 改用 spacing Token | 表格行视觉高度随 Density 变化，符合 F3 契约 |
| `tests/unit/layout-manager.spec.ts` | 默认、覆盖、非法值回退测试 | 无生产运行时风险 |
| `docs/fusion/F3/*` | 源码映射、实施记录、待决 ADR | 未批准视觉扩展仍为 REVIEW/PENDING |

## ADR 批准与兼容扩展

`F3-ADR-DECISIONS.md` 已记录本次批准：SaaS 通用视觉基础已补齐到 `src/theme/tokens/visual-foundation.json`，并明确不映射 GPU runtime。GPU `tokens.css` 继续只保留兼容别名；SaaS source 的新增值由独立 Schema/校验脚本验证。

## 未冻结参数

主题化 Radius、结构化 Shadow elevation、Motion duration tiers、Icon family/line-width、新断点/Z-index 和 DataViz 六色板仍见 `F3-ADR-PENDING.md`，本轮没有自行冻结。
