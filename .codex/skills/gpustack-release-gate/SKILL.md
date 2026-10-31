---
name: gpustack-release-gate
description: Evaluate actual build, test, security, theme and rollback evidence before GPUStack frontend release.
---

# gpustack-release-gate

## Authority and preconditions
Read this skill contract and validate it with `python3 scripts/validate_contracts.py` before execution. The contract is descriptive; enforcement is via schemas and Harness. Never self-approve.
Read repository `AGENTS.md`, `DESIGN.md`, task manifest and real source files. Do not claim tests passed without executable evidence. Do not alter backend API or permissions.

## Workflow
1. Read immutable task manifest, baseline and evidence; verify repository SHA and environment.
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

## V1.2 mandatory isolated execution
Never execute manifest commands on the host. For `--execute`, use an externally approved immutable execution policy outside the checkout. Match the full manifest SHA256, image digest and exact argv; reject policy mismatch. Run only through `scripts/secure_executor.py` macOS 原生可信执行 isolation. No local fallback; never pass credentials or macOS 原生可信执行 socket to task containers. See `docs/COMMAND-EXECUTION-SECURITY.md`.


> 本地 macOS 原生命令不是沙箱。不得执行未审查 PR；生产放行由受保护 CI 提供独立审批和证据。
