---
name: gpustack-page-migration
description: Migrate one GPUStack frontend page at a time preserving API contracts and business behavior.
---

# gpustack-page-migration

## Shared repository contract

- The only active design authority is the root [`DESIGN.md`](../../../DESIGN.md); archived documents are not active requirements.
- Read `AGENTS.md`, real page/API sources, and test scripts before editing. Preserve existing API, auth, permission, async, and route semantics.
- Prefer Nuxt UI 4 and existing `U*` adapters; reuse `src/theme` managers and `--gp-*` tokens. Do not create a page-local theme engine, Profile, or demo-only component copy.
- Showcase may be used for acceptance with local fixtures, but it cannot replace production page verification or enter the production bundle.
- Reports must contain real commands, exit codes, environment, artifacts, failures, repairs, and rollback information.

## Authority and preconditions
Read this skill contract and validate it with `python3 scripts/validate_contracts.py` before execution. The contract is descriptive; enforcement is via schemas and Harness. Never self-approve.
Read repository `AGENTS.md`, `DESIGN.md`, task manifest and real source files. Do not claim tests passed without executable evidence. Do not alter backend API or permissions.

## Workflow
1. Identify source page and target specification from root DESIGN.md; freeze API, auth, async states and acceptance cases.
2. Create file-level plan and allowlist before edits; stop if required evidence is missing.
3. Implement Vue3 TypeScript page using shared tokens and UI adapters; avoid unapproved dependencies.
4. Run typecheck, unit, integration, E2E and visual tests using configured scripts.
5. Report changed files, API parity, failed tests, visual differences and rollback steps.

## Required deliverables
- `MIGRATION-REPORT.md`
- `API-PARITY.md`
- `TEST-RESULTS.md`
- `VISUAL-DIFF.md`
- `RISK-REPORT.md`

## Decision rules
- `BLOCKED`: missing prerequisite, unapproved change, P0/P1, critical test failure or missing required evidence.
- `REVISE`: noncritical remediable findings; keep changes in allowed scope.
- `PASS`: all required checks verified and human approval recorded; no automatic merge or release.

## Recovery
At most three repair cycles. On repeated failure stop, preserve logs, report root cause and request human intervention.

## V1.1 contract chain
1. Validate `contract.json` with `schemas/skill-contract.schema.json`.
2. Validate task manifest with `schemas/task-manifest.schema.json`.
3. Generate evidence via trusted tools and validate against `schemas/evidence.schema.json`.
4. Run `scripts/gate.py` and validate its result with `schemas/gate-result.schema.json`.
5. Only `scripts/task_state.py` can enter PASS, referencing a valid PASS gate result.
