---
name: gpustack-repo-audit
description: Audit an existing GPUStack frontend repository without modifying application code. Use before migration planning.
---

# gpustack-repo-audit

## Authority and preconditions
Read this skill contract and validate it with `python3 scripts/validate_contracts.py` before execution. The contract is descriptive; enforcement is via schemas and Harness. Never self-approve.
Read repository `AGENTS.md`, `DESIGN.md`, task manifest and real source files. Do not claim tests passed without executable evidence. Do not alter backend API or permissions.

## Workflow
1. Confirm git SHA, dirty tree, runtime and package manager without changing files.
2. Inventory routes, views, components, stores, API calls, authentication, permissions, themes, locale and tests.
3. For every claim attach repository-relative path and line numbers; mark unknowns UNKNOWN.
4. Produce page inventory, API contract, design gap, risk register and migration ADR recommendation.
5. Do not run install commands without explicit permission; never assume build success.

## Required deliverables
- `M0-AUDIT.md`
- `PAGE-INVENTORY.md`
- `API-CONTRACT.md`
- `DESIGN-GAP.md`
- `RISK-REGISTER.md`

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
