# 复用检索指南

新增组件、组合函数、工具函数或服务前，先搜索已有实现，优先复用或扩展，避免复制平行实现。

## 检索命令

```bash
npm run reuse:search -- DataTable
npm run reuse:search -- auth
npm run reuse:search -- theme
```

脚本只负责在以下范围输出候选路径和匹配行：

- `src/components`
- `src/composables`
- `src/utils`
- `src/services`
- `src/api`
- `src/modules`

## 决策

- **REUSE**：现有能力满足需求，直接使用。
- **EXTEND**：现有能力接近需求，增加向后兼容的参数或组合点。
- **ADD**：确认没有合适实现后新增，并在交付说明中写明原因。

选择新增前至少检查：

1. 是否有相同职责的公共组件或函数；
2. 是否可以通过现有 Nuxt UI 原语或薄 `U*` 适配器解决；
3. 新代码是否会把页面私有逻辑扩散到公共层；
4. 是否会造成第二套 Token、主题或请求封装。

脚本只输出候选，不评价复用结果；最终决策由实现者和代码评审负责。
