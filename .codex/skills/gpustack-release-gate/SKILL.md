---
name: gpustack-release-gate
description: Evaluate actual build, test, security, theme and rollback evidence before GPUStack frontend release.
---

# gpustack-release-gate

## Shared repository contract

- The only active design authority is the root [`DESIGN.md`](../../../DESIGN.md); reject stale dual-layer or project-Profile assumptions.
- Verify production and Showcase reuse the same `src/theme`, `src/components`, F4 adapters, Patterns, and `--gp-*` token contract. Showcase must be absent from production output.
- Reject missing evidence, P0/P1 defects, API drift, unapproved baselines, and any command without an actual exit code.
- A PASS requires a valid gate result, a state record, and explicit human approval; this Skill never self-approves.

## Authority and preconditions
Read this skill contract and validate it with `python3 scripts/validate_contracts.py` before execution. The contract is descriptive; enforcement is via schemas and Harness. Never self-approve.
Read repository `AGENTS.md`, `DESIGN.md`, task manifest and real source files. Do not claim tests passed without executable evidence. Do not alter backend API or permissions.

## Workflow
1. Read root DESIGN.md, immutable task manifest, baseline and evidence; verify repository SHA and environment.
2. Run configured commands and record exit codes, duration, logs and output hashes.
3. Reject missing evidence, P0/P1 defects, unapproved API drift or baseline changes.
4. Produce PASS, REVISE or BLOCKED with reasons; PASS requires explicit human approval.
5. Record release artifact checksum, smoke results and rollback rehearsal before production release.

## Required deliverables
- `GATE-RESULT.json`
- `GATE-REPORT.md`
- `RELEASE-CHECKLIST.md`

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

## Isolated release execution

Release execution must use an externally approved immutable CI policy with repository SHA, image digest and exact argv matching. This checkout does not provide a local release executor; local commands are verification evidence only and cannot authorize deployment. Protected CI must attach its isolation policy and rollback evidence to the release report.
