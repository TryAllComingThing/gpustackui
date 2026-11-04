# 接入与升级说明（复制模板形态）

产品形态：**复制模板**，不发布 npm 安装包。根包保持 `private: true`，以源码复制方式交付。

## 事实源
- 版本唯一事实源：`package.json` 的 `version`（当前 `0.2.0`）。
- 当前内部基线标识：`0.2.0-internal-template-baseline`，详见根 `BASELINE.md`。
- 设计唯一事实源：根 `DESIGN.md` 与 `src/theme/tokens/`。
- 质量入口：`npm run quality:check`；发布门禁见 `docs/quality/QUALITY-GATES.md`。

## 基线消费边界

- 0.2.0 基线以复制模板交付，不提供 npm 安装包、库导出或跨项目自动升级承诺。
- 复制后应将 `BASELINE.md` 中的基线 ID 与候选提交 SHA 记录到业务工程，作为后续人工 diff 的锚点。
- 业务工程可以替换页面、API 领域和 locale，但不得复制出第二套 `DESIGN.md`、主题引擎或 `--ds-*` 运行时变量。

## 复制模板接入
1. 复制仓库为新的应用工程（去掉 `.git` 后重新初始化，或从模板仓库派生）。
2. `npm install`。
3. 修改品牌：`src/App.vue` 的 `#brand`、`README.md`、`public/favicon.svg`。
4. 新增业务模块：`npm run create:module -- <kebab-case-name>`，然后从 `src/modules/<name>/index.ts` 导入生成的 `<name>Routes` 汇总到 `src/app/router/routes.ts`，并补齐 locale key。
5. 后端契约放在 `src/api/<name>/`；模块私有组件放在 `src/modules/<name>/components/`，跨模块公共组件才上移到 `src/components/`。

## 禁止修改区（升级时人工合并）
- `src/theme/tokens/` 与生成文件 `src/theme/styles/themes/*.css`；改主题请改源 JSON 后运行 `npm run generate:theme-css`。
- Theme/Density/Typography/Layout/Locale manager 与 `--gp-*` Token 契约。
- `src/components/common/` 与 `src/components/patterns/` 的公共 API。

## 升级路径
- 以 `package.json` 版本为锚点记录每次升级。
- 业务模块只依赖公共契约（`--gp-*`、薄 `U*` adapter、i18n key、`src/api`），不修改框架核心。
- 升级采用人工 diff：合并 `DESIGN.md`、`src/theme`、`src/components`、`src/api`、`src/locales`、`scripts`、`docs`；保留 `src/modules` 业务实现。

## 基线与回滚

- 冻结基线必须先有干净候选提交、绑定 SHA 的 `npm run quality:check` 证据和人工批准；未满足时状态为 `BLOCKED`。
- 升级前记录当前 `package.json` 版本、`BASELINE.md` 基线 ID 和候选提交 SHA。
- 回滚时保留业务 `src/modules`、后端契约和用户数据，按提交回退框架文件、Token、组件、API 传输层和依赖锁文件；不得删除失败证据。
- 全仓库已跟踪文本文件已完成 LF 归一化，包括 `.codex/skills/`。升级 diff 中发现 CRLF 变化时，应与功能变更分开审查。
