---
name: gpustack-repo-audit
description: Audit an existing Vue/Nuxt UI frontend repository without modifying application code, then identify reusable assets, gaps, and migration risks.
---

# gpustack-repo-audit

## When to use

Use before migration, framework extraction, or a large refactor when the current repository state is not well understood.

## Read first

- Root `AGENTS.md`, `DESIGN.md`, and the architecture documents.
- The real route, component, theme, API, auth, locale, showcase, and test sources.
- `package.json` scripts and build configuration.

## Workflow

1. Record the current branch, working tree state, runtime, package manager, and active entry points without changing files.
2. Inventory routes, pages, components, stores, API calls, authentication, permissions, themes, locale resources, and tests.
3. Classify existing assets as REUSE, MODIFY, REMOVE, or DEFER with repository-relative path and line references.
4. Compare the current implementation with `DESIGN.md`, architecture docs, and the three Skill contracts.
5. Identify duplicate implementations, stale references, dead commands, generated files, and missing test coverage.
6. Produce a concise audit with page inventory, API contract, design gaps, risks, and a migration recommendation.

## Output

- Findings anchored to paths and line numbers.
- Unknowns marked `UNKNOWN` rather than guessed.
- A prioritized migration or cleanup plan.
- No application code changes during the audit.

## Boundaries

- Do not assume a GPU-specific profile or invent one.
- Do not run install commands without the task owner's agreement.
- Do not describe a build or test as passing without running it.
