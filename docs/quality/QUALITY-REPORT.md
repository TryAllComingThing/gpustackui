# Unified Quality Report

Release decision: **PASS**

Run: `2026-11-01T15:44:59.127650+00:00` → `2026-11-01T15:46:34.797289+00:00` (95670 ms)
Environment: macOS-15.2-arm64-arm-64bit; Node v22.22.0; pnpm 9.3.0; Playwright Version 1.64.1

| Category | Check | Exit code | Duration (ms) | Status | Evidence |
|---|---|---:|---:|---|---|
| Static | contracts | 0 | 43 | PASS | `docs/quality/evidence/S-001-contracts.log` |
| Static | skills | 0 | 208 | PASS | `docs/quality/evidence/S-002-skills.log` |
| Static | structure | 0 | 200 | PASS | `docs/quality/evidence/S-003-structure.log` |
| Static | typecheck | 0 | 2055 | PASS | `docs/quality/evidence/S-004-typecheck.log` |
| Static | typecheck-showcase | 0 | 3381 | PASS | `docs/quality/evidence/S-005-typecheck-showcase.log` |
| Static | lint | 0 | 428 | PASS | `docs/quality/evidence/S-006-lint.log` |
| Static | f2-tokens | 0 | 203 | PASS | `docs/quality/evidence/S-007-f2-tokens.log` |
| Static | f3-tokens | 0 | 209 | PASS | `docs/quality/evidence/S-008-f3-tokens.log` |
| Static | diff-check | 0 | 24 | PASS | `docs/quality/evidence/S-009-diff-check.log` |
| Build | production-build | 0 | 4631 | PASS | `docs/quality/evidence/B-001-production-build.log` |
| Build | showcase-build | 0 | 6345 | PASS | `docs/quality/evidence/B-002-showcase-build.log` |
| Functional | unit | 0 | 905 | PASS | `docs/quality/evidence/F-001-unit.log` |
| Functional | production-e2e | 0 | 6172 | PASS | `docs/quality/evidence/F-002-production-e2e.log` |
| Functional | showcase | 0 | 19380 | PASS | `docs/quality/evidence/F-003-showcase.log` |
| Visual | visual | 0 | 21435 | PASS | `docs/quality/evidence/V-001-visual.log` |
| Accessibility | accessibility | 0 | 10187 | PASS | `docs/quality/evidence/A-001-accessibility.log` |
| Accessibility | strict-axe-browser-visual | 0 | 19065 | PASS | `docs/quality/evidence/A-002-strict-axe-browser-visual.log` |
| Accessibility | showcase-isolation | 0 | 207 | PASS | `docs/quality/evidence/A-003-showcase-isolation.log` |

## Release Decision Inputs

- Failed checks: `none`
- Unexecuted checks: `none`
- Missing evidence: `none`
- Open defects: `none`

A required failure, unexecuted check, missing evidence, or open defect forces `BLOCKED`.
