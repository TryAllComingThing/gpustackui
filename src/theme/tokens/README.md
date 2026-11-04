# Theme Token Source

This directory is the single machine-readable token source for the Vue SaaS framework.

| Asset | Migrated from | Runtime consumer |
|---|---|---|
| `themes/A2.json`, `B.json`, `C.json`, `D.json`, `E.json` | SaaS and design-system theme dictionaries (migrated before directory removal) | `scripts/generate_theme_css.py` → `src/theme/styles/themes/*.css` |
| `typography.json` | migrated design-system typography token | `src/theme/typography.manager.ts` |
| `density.json` | migrated design-system density token | `src/theme/density.manager.ts` |
| `SEMANTIC_MAPPING.json` | SaaS token mapping | semantic validation and documentation |
| `COMPONENT_MAPPING.json` | SaaS token mapping | component validation and documentation |
| `schema/*.json` | token contract schemas | validation scripts |
| `visual-foundation.json` | SaaS M0 visual foundation | `scripts/validate_saas_visual_foundation.py`; no GPU runtime mapping |

The old SaaS and design-system directories have been removed after migration. This manifest preserves the provenance mapping.

## Framework panorama

- Architecture: this directory is the single token source; theme JSON and typography/density JSON feed generated CSS and runtime managers, then the Nuxt UI bridge.
- Design approach: one `--gp-*` namespace, one-way compatibility aliases, orthogonal Theme/Density/Typography/Layout.
- Principles: reproducibility, traceability, reversibility, minimal drift and evidence-driven changes.
- Landing path: register source → approve semantic changes → regenerate CSS → validate runtime and browser behavior.
- Delivery plan: the 2026-11-03 compatibility recommendations are approved and implemented; future value changes still require approval. No parallel values or `--ds-*` namespace. See `docs/design/TOKEN-MAPPING.md`.
