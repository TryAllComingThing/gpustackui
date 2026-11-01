---
name: gpustack-design-system
description: Implement GPUStack UI Design System V2.4 with multi-theme token contracts and component verification.
---

# gpustack-design-system

## Shared repository contract

- The only active design authority is the root [`DESIGN.md`](../../../DESIGN.md); archived documents are traceability evidence only.
- Read `AGENTS.md`, the real source, and the configured test scripts before editing. Never invent a second DESIGN.md, project Profile, theme engine, or `--ds-*` runtime namespace.
- Prefer Nuxt UI 4 primitives. Create or use a thin `Drp*` adapter only for cross-page routing, state, accessibility, stable test IDs, or project layout behavior.
- Components and Showcase must share `src/theme`, `src/components`, the Theme/Density/Typography/Layout managers, and `--gp-*` tokens. Showcase uses local fixtures and never enters production routes or bundles.
- A quality report must include command, exit code, environment, artifact/report paths, failures, and repairs. Missing or unexecuted evidence is never PASS.

## Authority and preconditions
Read this skill contract and validate it with `python3 scripts/validate_contracts.py` before execution. The contract is descriptive; enforcement is via schemas and Harness. Never self-approve.
Read repository `AGENTS.md`, `DESIGN.md`, task manifest and real source files. Do not claim tests passed without executable evidence. Do not alter backend API or permissions.

## Workflow
1. Read the root DESIGN.md authority first; block undocumented theme values rather than invent them.
2. Map primitive, semantic and component tokens; register allowed theme IDs and supported modes.
3. Implement runtime theme switch, persistence, first-paint application, fallback and system preference handling.
4. Validate header breadcrumbs, navigation, tables, dialogs, charts, overlays and keyboard focus in all supported themes.
5. Generate Showcase evidence and review reports; never overwrite baselines automatically without an explicit approved baseline update.

## Required deliverables
- `TOKEN-MAPPING.md`
- `THEME-CONTRACT.md`
- `COMPONENT-MATRIX.md`
- `THEME-TEST-REPORT.md`

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
