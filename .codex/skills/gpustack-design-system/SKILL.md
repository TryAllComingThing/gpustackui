---
name: gpustack-design-system
description: Implement and extend the framework design system V2.4 with multi-theme tokens, orthogonal appearance/density runtime, thin U* adapters, and shared Showcase components.
---

# gpustack-design-system

## When to use

Use for Token, theme, Appearance, Density, Typography, Layout, shared component, Pattern, or Showcase changes.

## Read first

- Root `AGENTS.md` and `DESIGN.md`.
- `docs/design/TOKEN-MAPPING.md`, `THEME-CONTRACT.md`, and `COMPONENT-MATRIX.md`.
- The real source under `src/theme`, `src/components`, and `showcase`.
- Relevant tests and `package.json` scripts.

## Rules

- Keep one active design authority and one `--gp-*` runtime namespace. Never create a second DESIGN.md, profile, theme engine, or `--ds-*` namespace.
- Prefer Nuxt UI 4 primitives. Add a thin `U*` adapter only for cross-page state, accessibility, recursive decoration, stable DOM contracts, or layout behavior.
- Production and Showcase share `src/components`, `src/theme`, and all runtime managers.
- Keep Theme, Appearance, Density, Locale, Typography, and Layout orthogonal. Appearance resolves `system/light/dark` into `data-appearance` plus a compatibility `dark` class; it must not create a second theme or `--ds-*` namespace.
- Showcase uses local fixtures only and never enters production routes or bundles.
- Edit Token source files, not generated theme CSS. Do not hardcode theme HEX in business components.

## Workflow

1. Identify the affected Token layer: primitive, semantic, component, or compatibility.
2. Search for an existing primitive, adapter, or Pattern before adding a new one.
3. Update source JSON, mapping, or component code.
4. Regenerate theme CSS when theme sources change.
5. Add or update the real Showcase state and stable `data-testid` when the change is visual or interactive.
6. Run the affected checks:
   - `npm run check:theme-css`
   - `npm run check:tokens`
   - `npm run typecheck`
   - `npm run test:unit`
   - `npm run build:showcase`
   - applicable Showcase or accessibility tests
7. Update documentation, i18n, and tests affected by the change.

## Boundaries

- Do not alter backend API, auth, or permission semantics.
- Do not add a visual state to the matrix unless a real implementation and local fixture exist.
- Do not hide failed checks or describe unexecuted checks as passed.
