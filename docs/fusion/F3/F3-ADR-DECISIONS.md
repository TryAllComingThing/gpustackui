# F3 视觉扩展 ADR 决策记录

状态：**APPROVED（SaaS source） / APPROVED（GPU mapping excluded）**

本记录依据本次用户确认：缺失的通用 SaaS 视觉参数可以补齐和细化；GPU 不需要映射。新增值统一写入 SaaS-only `visual-foundation.json`，不改变 GPU `--gp-*` runtime。

批准人：用户（本次会话确认）  
批准日期：2026-11-01  
审批范围：F3-001 至 F3-006 的兼容别名、回滚和延期决策。  
限制：SaaS source 值已批准；GPU runtime 映射仍是独立范围，未经单独决策不得接入。

## ADR-F3-001：Radius 兼容层

状态：**APPROVED（SaaS source） / APPROVED（GPU mapping excluded）**

决策：SaaS source 使用 A2/B/C/D/E 的 sm/md/lg/xl Radius；GPU 继续使用现有固定 Radius，不做映射。

依据：`DESIGN.md` §5、`src/theme/styles/tokens.css`、F3-D-001。保留兼容 Token 是因为现有组件和旧变量已经引用这些名称，删除或改值会造成组件几何回退。

影响：Radius 语义映射、组件 CSS、旧别名。验证：Token 引用检查、生产/Showcase 构建、Playwright 计算样式。

## ADR-F3-002：Shadow 兼容层

状态：**APPROVED（SaaS source） / APPROVED（GPU mapping excluded）**

决策：SaaS source 定义 Elevation 0–3 的 canonical shadow 值；GPU 继续使用现有三层兼容变量，不做映射。

依据：`DESIGN.md` §5、SaaS DESIGN §6 明确 M1 才结构化阴影、F3-D-002。保留兼容 Token 可避免现有卡片、Popover、Modal 失去阴影。

影响：Surface/overlay 组件和旧 `--shadow-card` 别名。验证：computed `box-shadow`、构建和回归测试。

## ADR-F3-003：Motion 兼容层

状态：**APPROVED（SaaS source） / APPROVED（GPU mapping excluded）**

决策：SaaS source 定义 standard `160ms`、overlay `200ms`、reduced `0ms`；GPU 继续保留现有 Sidebar 行为，不做映射。

依据：`DESIGN.md` §5、`src/theme/styles/tokens.css`、F3-D-003。保留现有时长保证当前折叠交互和减少动效行为不变。

影响：Sidebar、导航和媒体查询。验证：transition computed style、prefers-reduced-motion 测试。

## ADR-F3-004：Icon 兼容层

状态：**APPROVED（SaaS source） / APPROVED（GPU mapping excluded）**

决策：SaaS source 定义 Lucide、2px 线宽和 xs/sm/md/lg 尺寸；GPU 继续使用现有 Lucide/Nuxt UI，不做映射。

依据：`DESIGN.md` §5、`src/components/layout/AppSidebarNav.vue`、F3-D-004。保留现有 family 避免图标名称和视觉重量变化。

影响：导航、按钮和 Showcase。验证：键盘/名称测试、尺寸 computed style、构建。

## ADR-F3-005：Layout Z-index 与断点

状态：**APPROVED（SaaS source） / APPROVED（GPU mapping excluded）**

决策：SaaS source 定义 generic z-index 和 768/1024/1280/1600 breakpoints；GPU 继续使用 Header 60px、Sidebar 200px/64px 和项目受控响应式规则，不做映射。

依据：F1 ADR-D04/D05/D06、`DESIGN.md` §4、F3-D-005。受控布局变量允许明确覆盖，页面 CSS 不得自由改写。

影响：AppShell、移动抽屉、Breadcrumb。验证：1440/390 视口 E2E 和 layout manager unit test。

## ADR-F3-006：DataViz 兼容色板

状态：**APPROVED（SaaS source） / APPROVED（GPU mapping excluded）**

决策：SaaS source 为每个 A2/B/C/D/E 主题定义 Categorical6/12、Sequential5、Diverging7、Semantic、Neutral；颜色全部引用现有主题语义色。GPU 保留 `--gp-chart-1..5`，不做映射。

依据：`DESIGN.md` §7、`design-system/qa/validation.json`、F3-D-006。保留现有五色板避免图表颜色和语义漂移。

影响：主题 CSS、图表调用方和 DataViz 文档。验证：主题 CSS parity、图表 Token 引用审计。

## 后续扩展门槛

延期项重新开启时，必须补充来源文件、Primitive/Semantic/Component 变更、五主题影响、Density 影响、兼容别名、回滚方式和真实验证命令；未满足前不得改生成器或运行时。
