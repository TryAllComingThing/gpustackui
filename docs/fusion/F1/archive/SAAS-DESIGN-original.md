# 企业级 SaaS UI Design System V1.1-REVIEW — M0 DESIGN.md

> 状态：M0-CANDIDATE（规范资产已形成，待设计/技术/安全/测试签审）。本文件供 Codex 和 Vue 前端团队使用。不得将本规范通过视为 Vue 组件、axe-core 或跨浏览器验收通过。

## 1. 目标与非目标
- 目标：五套主题 A2/B/C/D/E，一套 Vue3 + TypeScript + Nuxt UI + Tailwind CSS + CSS Variables + Lucide 组件体系；可追溯的 Token、组件状态、页面模式和质量门禁。
- 不在 M0 实施：真实组件、Dark Mode、完整 Categorical-12/Sequential/Diverging 图表配色、SSR 适配和跨浏览器自动化。以上必须登记为 M1–M4 工作项。
- 严禁因主题切换改变业务逻辑、表单值、滚动位置、权限、组件 API 或密度。Theme、Density、Appearance、Locale、Motion 独立存储。

## 2. 五主题定位与冻结色值
|主题|名称|主色|亮色|背景 Canvas|建议场景|
|---|---|---|---|---|---|
|A2|沉稳商务蓝|#1554B4|#2465C5|#F5F8FC|ERP、集团管理|
|B|明亮天空蓝|#1469D8|#1260C7|#F7FAFF|协同、CRM|
|C|深海智慧蓝|#1769AA|#155F9B|#F4F8FB|工业、数据分析|
|D|蓝紫未来科技|#315CF5|#2D53DF|#F7F8FF|AI 应用|
|E|活力科技蓝|#0D61F2|#3585FF|#F6F9FE|AI 服务与数字门户|

五主题全部 37 个基础色 + 10 个透明度色定义见 `tokens/TOKEN_DICTIONARY.csv` 和 `tokens/themes/*.json`。色板中 `brand.accent` 是品牌亮色，**不是**按钮 hover 的无障碍保证值；所有交互文字/图标必须按实际背景验证。

## 3. Token 三层契约
- Primitive：`tokens/themes/*.json` 中的色值，以及字体、间距、圆角等原始值。
- Semantic：`tokens/SEMANTIC_MAPPING.json`，统一 `surface.* / text.* / action.* / feedback.* / border.*`。映射值为相对 Primitive 路径。
- Component：`tokens/COMPONENT_MAPPING.json`，组件通过语义 Token 引用，严禁业务页面硬编码主题 HEX。
- M1 必须引入 JSON Schema、循环引用检测、缺失 Key 检测、组件 Token 覆盖审计；当前文件为输入契约，不是完整编译器。
- E 主题 pressed 色当前沿用深色 `#084BC2` 作为保守候选，M1 必须设计独立的 pressed 色，并审计五套主题各状态。不能直接将亮色 #3585FF 用作白字按钮悬浮背景。

## 4. Typography
字体栈：`Inter, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`；数字 `font-variant-numeric: tabular-nums`，代码单独等宽字体栈。

|语义|px|weight|line-height px|
|---|---:|---:|---:|
|display|32|700|40|
|page-title|24|600|32|
|section-title|20|600|28|
|card-title|16|600|24|
|body|14|400|22|
|body-small|13|400|20|
|caption|12|400|18|
|numeric|14|500|22|
|code|13|400|20|

九级字号不随主题切换。12px 不承载关键错误或主要业务结论。长文本需省略提示、展开或复制完整内容。

## 5. Spacing / Density / Layout
间距基于 4px 网格：4/8/12/16/20/24/32/40/48。密度表见 `contracts/LAYOUT_MATRIX.csv`。Header 60px、Sidebar 232/64px、面包屑放在 Header。布局与主题解耦，断点建议 768/1024/1280/1600px；1024px 以下以任务为中心重新布局，不强制压缩数据表格。

## 6. Surface / Radius / Elevation
五级 Surface：`canvas/default/subtle/raised/overlay`；后两者浅色可使用白色，但须用边框/阴影建立层次。
圆角 `sm/md/lg/xl`：A2=4/6/10/14；B=6/10/14/18；C=2/4/8/12；D=6/12/16/20；E=4/8/12/16（px）。
Elevation 0–3：无阴影、卡片轻阴影、Popover/Dropdown、Modal/Drawer。阴影颜色和数值须在 M1 单独结构化，避免视觉漂移。

## 7. Component Contract
组件矩阵见 `contracts/COMPONENT_MATRIX.csv`。组件 API 必须明确 `variant / size / disabled / loading / error / readonly / modelValue` 等适用属性、Slots、Events、可访问性语义。`focus-visible` 不得以 hover 替代。Readonly 与 Disabled 不得混用。Modal/Drawer 需焦点约束、Escape 关闭策略和关闭后焦点恢复。表格必须验证排序、跨页选择、溢出、空状态、加载和错误。
组件适配层示例 `DrpButton` → Nuxt UI Button；封装仅针对跨项目需要统一行为与样式的核心组件，不对所有基础组件无差别包装。

## 8. Interaction / Feedback
状态集合 default/hover/pressed/focus-visible/selected/disabled/readonly/loading/error/success 按组件适用性选择。Toast 不替代重要错误的持久显示；保存失败保留输入；批量任务须显示部分失败详情；异步任务支持进度、取消（若后端支持）、重试及通知。动效常规 120–180ms，浮层 160–220ms，支持 prefers-reduced-motion。

## 9. Business Templates & Patterns
八模板：T01 工作台、T02 列表、T03 详情、T04 编辑、T05 审批、T06 驾驶舱、T07 主从工作台、T08 系统配置。
六 Pattern：P01 高级筛选、P02 批量操作、P03 主从联动、P04 多步骤向导、P05 审批工作流、P06 异步任务。必须具备状态恢复、错误、权限及空数据设计。

## 10. Data Visualization
每主题须具备 Categorical-6/12、Sequential-5、Diverging-7、Semantic、Neutral 六类色板。当前仅五主题基础语义色已冻结；其他图表色板属于 M1 待定资产，禁止假定已完成。图表需同时提供线型、符号或数据标签，不能只靠颜色区分。

## 11. Accessibility / Responsive
目标 WCAG 2.2 AA；普通文本 4.5:1、大文本 3:1、必要非文本 UI 3:1；键盘、焦点、缩放、读屏、表单关联、状态播报均需验证。axe-core 零 Critical/Serious 不是完整 AA 证明。禁止用 Disabled 文本的对比度例外掩盖可交互元素的可读性问题。

## 12. Tenant Configuration & Versioning
优先级：安全/无障碍约束 > 企业强制策略 > 用户偏好 > 企业默认 > 产品默认。企业品牌覆盖须校验后发布；主题版本使用 SemVer、支持快照、审计、回滚。Dark Mode 和 Enhanced Contrast 尚未设计完成，不得标记生产支持。

## 13. Codex 开发规则
1. 先读本 DESIGN.md、五主题 JSON、两份矩阵和验收清单，再修改组件。
2. 不得自行发明主题 HEX、Token Key、组件 API；缺失时记录 DESIGN-DECISION，提交评审。
3. 组件实现先覆盖默认/悬浮/按下/键盘焦点/禁用/加载/错误等适用状态，再做业务页面。
4. 所有组件从 Semantic/Component Token 取值；不能直接引用原始 HEX（底层 Token 定义文件除外）。
5. 任何主题/密度变更必须保证用户输入和业务状态不丢失。
6. 每次提交附上：受影响 Token、组件状态、测试用例、截图、兼容性风险。
7. 不得声称运行了未执行的 npm build、Playwright、axe-core 或浏览器测试。

## 14. M0 → M1 Gate
M0 通过条件：五主题字典键一致、颜色合法、矩阵覆盖、视觉规则经设计/前端/产品/测试/安全签审；所有未决项记录。M1 首先完成 Schema、Token 编译器、状态色、图表色板、真实 Nuxt UI 兼容性 PoC。生产冻结须在 M4/M5 通过真实测试之后。
