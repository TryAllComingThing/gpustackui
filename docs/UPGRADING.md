# 接入与升级说明（复制模板形态）

产品形态：**复制模板**，不发布 npm 安装包。根包保持 `private: true`，以源码复制方式交付。

## 事实源
- 版本唯一事实源：`package.json` 的 `version`（当前 `0.2.0`）。
- 设计唯一事实源：根 `DESIGN.md` 与 `src/theme/tokens/`。
- 质量入口：`npm run quality:check`；发布门禁见 `docs/quality/QUALITY-GATES.md`。

## 复制模板接入
1. 复制仓库为新的应用工程（去掉 `.git` 后重新初始化，或从模板仓库派生）。
2. `npm install`。
3. 修改品牌：`src/App.vue` 的 `#brand`、`README.md`、`public/favicon.svg`。
4. 新增业务模块：`npm run create:module -- <kebab-case-name>`，然后注册路由、导航与 locale key。

## 禁止修改区（升级时人工合并）
- `src/theme/tokens/` 与生成文件 `src/theme/styles/themes/*.css`；改主题请改源 JSON 后运行 `npm run generate:theme-css`。
- Theme/Density/Typography/Layout/Locale manager 与 `--gp-*` Token 契约。
- `src/components/common/` 与 `src/components/patterns/` 的公共 API。

## 升级路径
- 以 `package.json` 版本为锚点记录每次升级。
- 业务模块只依赖公共契约（`--gp-*`、薄 `U*` adapter、i18n key），不修改框架核心。
- 升级采用人工 diff：合并 `DESIGN.md`、`src/theme`、`src/components`、`src/locales`、`scripts`、`docs`；保留 `src/modules` 业务实现。
