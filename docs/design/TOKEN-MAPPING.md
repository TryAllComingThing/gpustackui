# Vue 3 SaaS Framework Token Mapping

Canonical source is `src/theme/tokens/`; the frozen source manifest is `docs/fusion/FRAMEWORK/FROZEN-SOURCES.csv`. Runtime components consume `--gp-*` variables from `src/theme/styles/`.

- Primitive theme values: `src/theme/tokens/themes/*.json` → `scripts/generate_theme_css.py` → `src/theme/styles/themes/*.css`;
- Typography: `src/theme/tokens/typography.json` → `src/theme/typography.manager.ts` → `--gp-type-*`;
- Density: `src/theme/tokens/density.json` → `data-density` selectors and `--gp-*` geometry variables;
- Surface, text, border, radius, shadow, motion and icon aliases: `src/theme/styles/tokens.css`;
- Component and layout semantics: `src/theme/styles/components.css` and `layout.css`.
- Nuxt UI bridge: `src/theme/styles/nuxt-ui.bridge.css`, imported by production `main.css` and `showcase/showcase.css`.

Legacy aliases remain only for compatibility and must resolve to canonical `--gp-*` values. No business component may introduce theme HEX literals or a parallel `--ds-*` runtime namespace. Unapproved radius, shadow, motion, icon-family and DataViz extensions remain `PROPOSED`/`PENDING` in `docs/fusion/FRAMEWORK/FUSION-MATRIX.csv`.
