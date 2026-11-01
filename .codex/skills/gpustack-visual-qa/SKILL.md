---
name: gpustack-visual-qa
description: Perform reproducible multi-theme visual regression and accessibility review of GPUStack UI.
---

# gpustack-visual-qa

## Shared repository contract

- The only active design authority is the root [`DESIGN.md`](../../../DESIGN.md).
- Validate real production and Showcase implementations that share `src/theme`, `src/components`, F4 adapters, Patterns, and `--gp-*` tokens. Do not build a parallel visual fixture implementation.
- Lock the actual Theme/Density managers, local fixtures, viewport, locale, timezone, browser, and fonts. Record every command and exit code.
- axe-core, browser matrix, screenshots, and manual WCAG checks are executed or explicitly recorded as `NOT EXECUTED`; never convert missing evidence to PASS.

## Authority and preconditions
Read this skill contract and validate it with `python3 scripts/validate_contracts.py` before execution. The contract is descriptive; enforcement is via schemas and Harness. Never self-approve.
Read repository `AGENTS.md`, `DESIGN.md`, task manifest and real source files. Do not claim tests passed without executable evidence. Do not alter backend API or permissions.

## Workflow
1. Lock browser engine, viewport, device scale, fonts, locale, timezone, Theme/Density managers, and fixture data.
2. Capture each supported theme and mode for component states and representative business pages.
3. Compare screenshots without auto-accepting changed baselines; categorize intentional versus regressions.
4. Check contrast, keyboard focus, overflow, popovers, charts and dynamic states; report axe findings separately.
5. Provide paths to actual screenshots, diff artifacts and reproduction commands.

## Required deliverables
- `VISUAL-MATRIX.md`
- `VISUAL-DIFF.md`
- `ACCESSIBILITY.md`

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
