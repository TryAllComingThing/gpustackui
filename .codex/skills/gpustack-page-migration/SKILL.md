---
name: gpustack-page-migration
description: Migrate or implement one frontend page while preserving API contracts, auth behavior, and module boundaries.
---

# gpustack-page-migration

## When to use

Use for a single page migration, page refactor, or new module page that must keep backend and business behavior intact.

## Read first

- Root `AGENTS.md` and `DESIGN.md`.
- `docs/architecture/ARCHITECTURE.md`, `API-CONTRACT.md`, and `AUTH-AND-PERMISSIONS.md`.
- The source page, target module, API contracts, router metadata, locale files, and tests.

## Workflow

1. Identify the source page, target module, route metadata, and API contract.
2. Freeze observable behavior: request shape, auth, permissions, loading/empty/error states, filters, pagination, and navigation.
3. Search existing components, composables, utils, services, and module public exports with `npm run reuse:search -- <capability>`.
4. Decide REUSE, EXTEND, or ADD for each candidate and keep page-private logic inside the module.
5. Implement with Nuxt UI primitives, shared `U*` adapters, `--gp-*` tokens, and existing managers.
6. Add or update unit, integration, and E2E coverage for the affected behavior.
7. Update routes, navigation metadata, i18n, and documentation.
8. Run typecheck, lint, unit tests, and the affected E2E or build commands.

## Boundaries

- Do not invent endpoints or change API/auth/permission semantics.
- Do not create a page-local theme engine or copy a Showcase-only component into production.
- Do not import another module's private implementation.
- Keep loading, empty, error, retry, disabled, keyboard, and focus behavior intact.
- Report changed files, behavior parity, reuse decisions, commands run, and remaining risks.
