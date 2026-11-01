# 企业级 SaaS UI Design System V1.1-M0（通用规范层）

> 状态：M0-CANDIDATE。本文是 SaaS 通用规范输入，不代表 Vue 组件、axe-core、跨浏览器、设计签审或生产冻结已通过。GPUStack 项目覆盖见根目录 `DESIGN.md`，冲突决策见 `docs/fusion/F1/adr/ADR-INDEX.md`；原始版本备份见 `docs/fusion/F1/archive/SAAS-DESIGN-original.md`。

## 1. 设计原则与适用范围

本文件适用于企业级 SaaS 的通用 Token、组件状态、布局密度、交互和质量门禁。原始色值以 `design-system/tokens/TOKEN_DICTIONARY.csv` 和 `design-system/tokens/themes/{A2,B,C,D,E}.json` 为唯一来源；语义映射以 `tokens/SEMANTIC_MAPPING.json` 为准；组件映射以 `tokens/COMPONENT_MAPPING.json` 为准。本文不重复维护 HEX、字号或间距数值。

规范优先级：安全与无障碍约束 > SaaS 通用规范 > 产品项目覆盖 > 用户偏好。任何项目覆盖必须在项目根 `DESIGN.md` 和 ADR 中有来源、范围、状态与验证方式。

## 2. 五套主题及颜色规范

通用主题 ID 为 A2、B、C、D、E，完整色值在 `tokens/TOKEN_DICTIONARY.csv` 与 `tokens/themes/*.json`。A2/B/C/D/E 的品牌、成功、警告、危险、信息、文字、边框、背景和 Alpha 键集合必须保持一致。`brand.accent` 是品牌亮色，不自动等同于 hover 或无障碍保证值；交互状态必须按真实前景/背景复测。

Theme 与 Density、Appearance、Locale、Motion 必须独立存储。主题切换不得改变业务逻辑、表单值、滚动位置、权限、组件 API 或密度。

## 3. Token 命名、层级与引用规则

- Primitive：`tokens/themes/*.json` 的原始值，以及后续独立 typography/density 资产。
- Semantic：`tokens/SEMANTIC_MAPPING.json` 的 `surface.* / text.* / action.* / feedback.* / border.*`。
- Component：`tokens/COMPONENT_MAPPING.json` 的组件语义引用。
- 业务页面和组件不得硬编码主题 HEX；只能从 Semantic/Component Token 获取颜色。
- Token 编译、JSON Schema、循环引用、缺失 Key 和覆盖率审计属于 M1 输入要求；当前 M0 文件不是完整编译器。

## 4. Typography

通用字号语义为 `display`、`page-title`、`section-title`、`card-title`、`body`、`body-small`、`caption`、`numeric`、`code`，其定义来源和审计依据为原始 `design-system/DESIGN.md` 备份及后续 typography 资产。九级字号不随主题切换；数字使用 tabular-nums；代码使用独立等宽字体；弱提示不得承载主要业务结论。

`design-system/tokens/typography.json` 已由 ADR-D07 批准；运行时 CSS 映射由 GPUStack `typography.manager.ts` 接入。

## 5. Spacing 与 Density

间距使用 4px 网格；Compact、Standard、Comfortable 三密度以及 control/table/card/field/section/filter 尺寸来源为 `contracts/LAYOUT_MATRIX.csv`。Density 必须与 Theme 解耦，切换不得丢失输入或业务状态。

`design-system/tokens/density.json` 已由 ADR-D08 批准；运行时 density manager 由 GPUStack `density.manager.ts` 接入。

## 6. Layout 与 Responsive

通用布局尺寸和断点以 `contracts/LAYOUT_MATRIX.csv` 与原始 SaaS DESIGN 备份为准。通用规范要求 Header、Sidebar、内容区和面包屑具备稳定语义，并在 768/1024/1280/1600 等断点下保持任务可用性；1024 以下不得简单压缩数据表格。

项目如覆盖 Sidebar、内容 padding 或 Header，仅能在项目根 `DESIGN.md` 记录覆盖，不得改写通用矩阵。

## 7. Surface、Radius、Border、Shadow

Surface 语义为 `canvas/default/subtle/raised/overlay`；边框、圆角、阴影的原始值来自 SaaS Token 资产和布局矩阵。浅色 Surface 仍须用边框或阴影建立层次。阴影的具体数值需独立结构化后再进入编译器。

## 8. Icon 与 Motion

图标必须具有语义、可键盘访问且不只依赖颜色传达状态。常规动效为 120–180ms，浮层为 160–220ms，并尊重 `prefers-reduced-motion`。项目覆盖必须记录到 ADR。

## 9. Component States

组件状态按适用性覆盖 `default/hover/pressed/focus-visible/selected/disabled/readonly/loading/error/success`。`focus-visible` 不得由 hover 替代；Readonly 与 Disabled 不得混用；Modal/Drawer 必须定义焦点约束、Escape 关闭和焦点恢复；Table 必须验证排序、跨页选择、溢出、空、加载和错误。

完整组件清单、状态、Theme、Density、A11y 和浏览器要求见 `contracts/COMPONENT_MATRIX.csv`，共 23 类；该矩阵是通用审计清单，不表示当前项目已经实现。

## 10. Form、Table、Navigation 等组件规范

Form 必须有 label/help/error 关联和状态播报；Table 必须有排序、选择、分页、空/加载/错误；Navigation 必须有选中、展开、键盘、嵌套和焦点；Modal/Popover/Drawer 必须处理遮罩、Escape、外部点击和焦点恢复。跨项目统一行为可使用薄 Drp 适配层，不得无差别包装全部基础组件。

## 11. 复杂业务交互 Pattern

通用模板为 T01–T08，Pattern 为 P01–P06，定义见原始 SaaS DESIGN 备份。高级筛选、批量操作、主从联动、多步骤向导、审批和异步任务必须设计状态恢复、错误、权限、空数据、重试和部分失败详情。

## 12. Data Visualization

每个通用主题最终应具备 Categorical-6/12、Sequential-5、Diverging-7、Semantic、Neutral 色板；当前 M0 仅冻结基础语义色，图表色板属于后续阶段。图表不得只靠颜色区分，必须有线型、符号、标签或数据表替代。

## 13. Accessibility

目标为 WCAG 2.2 AA 的语义和键盘基础：普通文本 4.5:1、大文本 3:1、必要非文本 UI 3:1；必须验证键盘、焦点、缩放、读屏、表单关联和状态播报。项目范围永久豁免 axe-core、Firefox、WebKit、截图和人工 WCAG 审计；这些项目不执行，也不标记为通过。

## 14. Showcase 与质量门禁

Showcase 是独立开发/验收入口，使用真实组件、独立 fixtures 和稳定 test ID，不进入生产路由或生产包。质量证据必须引用 `design-system/qa/ACCEPTANCE_CHECKLIST.csv`、`qa/validation.json`、项目测试日志和真实退出码。永久豁免项必须记录为豁免，不得将 Showcase 通过等同于业务页面或生产冻结通过。

## 15. 版本治理

主题和规范使用 SemVer；变更必须有 Token 影响、组件状态、测试、截图、兼容性风险、审计和回滚说明。当前 SaaS 规范状态为 M0-CANDIDATE；本项目已批准的 GPUStack 覆盖记录在 ADR 索引中，未决的通用扩展仍标记 `PROPOSED`。
