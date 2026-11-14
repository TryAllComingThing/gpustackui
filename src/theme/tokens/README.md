# Theme Token Source

This directory is the single machine-readable token source for the Vue SaaS framework.

| Asset | Consumer |
|---|---|
| `themes/standard.json`, `business.json`, `future.json`, `sky.json`, `ocean.json` | `scripts/generate_theme_css.py` → `src/theme/styles/themes/*.css` |
| `appearance.json` | `scripts/generate_theme_css.py` → `src/theme/styles/themes/appearance.css` |
| `typography.json` | `src/theme/typography.manager.ts` |
| `density.json` | `src/theme/density.manager.ts` |
| `SEMANTIC_MAPPING.json` | semantic mapping and documentation |
| `COMPONENT_MAPPING.json` | component mapping and documentation |
| `schema/*.json` | token source structure |
| `visual-foundation.json` | visual foundation reference; no GPU runtime mapping |

## Usage

- Edit theme, appearance, typography, or density JSON here, then regenerate CSS with `npm run generate:theme-css`.
- Keep compatibility aliases one-way toward canonical `--gp-*` tokens.
- Do not add a parallel `--ds-*` namespace or hardcode theme colors in components.
- See `docs/design/TOKEN-MAPPING.md` for the full pipeline and value map.
