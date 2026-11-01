# Theme Token Source

This directory is the single machine-readable token source for the Vue SaaS framework.

| Asset | Migrated from | Runtime consumer |
|---|---|---|
| `themes/A2.json`, `B.json`, `C.json`, `D.json`, `E.json` | SaaS and design-system theme dictionaries (migrated before directory removal) | `scripts/generate_theme_css.py` → `src/theme/styles/themes/*.css` |
| `typography.json` | migrated design-system typography token | `src/theme/typography.manager.ts` |
| `density.json` | migrated design-system density token | `src/theme/density.manager.ts` |
| `SEMANTIC_MAPPING.json` | SaaS token mapping | F2 semantic validation and documentation |
| `COMPONENT_MAPPING.json` | SaaS token mapping | F2 component validation and documentation |
| `schema/*.json` | F2/F3 contract schemas | validation scripts |
| `visual-foundation.json` | SaaS M0 visual foundation | `scripts/validate_saas_visual_foundation.py`; no GPU runtime mapping |

The old SaaS and design-system directories have been removed after migration. This manifest preserves the provenance mapping.
