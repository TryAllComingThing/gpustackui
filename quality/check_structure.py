from pathlib import Path
import sys
r=Path(__file__).resolve().parents[1]
required=[
'src/main.ts','src/App.vue','src/app/router','src/app/layouts','src/app/plugins','src/theme/theme.manager.ts','src/theme/theme.registry.ts','src/theme/styles/main.css','src/theme/tokens','src/theme/themes','src/components/ui','src/components/layout','src/components/common','src/modules/dashboard','src/modules/resources','src/modules/models','src/modules/deployments','src/modules/services','src/modules/settings','src/services/http','src/services/auth','src/stores','src/composables','src/locales','src/types','src/utils','src/assets','showcase/index.html','showcase/main.ts','showcase/App.vue','showcase/vite.config.ts','showcase/sections','showcase/fixtures','tests/integration','tests/e2e','tests/visual','tests/accessibility','quality/harness','quality/schemas','quality/tasks','docs/architecture/ARCHITECTURE.md','docs/design/TOKEN-MAPPING.md','docs/design/THEME-CONTRACT.md','docs/migration/INVENTORY.csv','docs/migration/BUSINESS-CONTRACT.md','docs/migration/MIGRATION-MAP.md','docs/quality/QUALITY-GATES.md','.github/workflows/pr-check.yml','.github/workflows/release.yml','.github/CODEOWNERS','AGENTS.md','DESIGN.md','README.md','package.json','vite.config.ts','vitest.config.ts','playwright.config.ts','eslint.config.js','tsconfig.json','index.html']
missing=[x for x in required if not (r/x).exists()]
print(f'Checked {len(required)} required paths; missing={len(missing)}')
for x in missing: print('MISSING',x)
sys.exit(1 if missing else 0)
