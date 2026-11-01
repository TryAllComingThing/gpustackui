#!/usr/bin/env python3
"""Unified quality entry point with evidence-bound release decision."""
from __future__ import annotations

import csv
import json
import os
import platform
import shlex
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "docs/quality"
EVIDENCE_DIR = REPORT_DIR / "evidence"

CHECKS = [
    ("S-001", "Static", "contracts", ["python3", "scripts/validate_contracts.py"]),
    ("S-002", "Static", "skills", ["pnpm", "validate:skills"]),
    ("S-003", "Static", "structure", ["pnpm", "check:structure"]),
    ("S-004", "Static", "typecheck", ["pnpm", "typecheck"]),
    ("S-005", "Static", "typecheck-showcase", ["pnpm", "typecheck:showcase"]),
    ("S-006", "Static", "lint", ["pnpm", "lint"]),
    ("S-007", "Static", "f2-tokens", ["pnpm", "validate:f2-tokens"]),
    ("S-008", "Static", "f3-tokens", ["pnpm", "validate:f3-tokens"]),
    ("S-009", "Static", "diff-check", ["git", "diff", "--check"]),
    ("B-001", "Build", "production-build", ["pnpm", "build"]),
    ("B-002", "Build", "showcase-build", ["pnpm", "build:showcase"]),
    ("F-001", "Functional", "unit", ["pnpm", "test:unit"]),
    ("F-002", "Functional", "production-e2e", ["pnpm", "test:e2e"]),
    ("F-003", "Functional", "showcase", ["pnpm", "test:showcase"]),
    ("V-001", "Visual", "visual", ["pnpm", "test:visual"]),
    ("A-001", "Accessibility", "accessibility", ["pnpm", "test:accessibility"]),
    ("A-002", "Accessibility", "strict-axe-browser-visual", ["pnpm", "test:strict"]),
    ("A-003", "Accessibility", "showcase-isolation", ["pnpm", "check:showcase-isolation"]),
]


def command_version(command: list[str]) -> str:
    try:
        result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, timeout=30)
        return (result.stdout or result.stderr).strip().splitlines()[0] if result.returncode == 0 else "UNKNOWN"
    except Exception:
        return "UNKNOWN"


def defects() -> list[dict[str, str]]:
    path = ROOT / "docs/fusion/F4/F4-DEFECTS.csv"
    if not path.exists():
        return [{"defect_id": "QUALITY-MISSING-DEFECTS", "severity": "P0", "status": "OPEN", "description": "F4 defect inventory is missing"}]
    with path.open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    return [row for row in rows if row.get("status") not in {"CLOSED", "MITIGATED"}]


def main() -> int:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    started = datetime.now(timezone.utc)
    environment = {
        "cwd": str(ROOT),
        "platform": platform.platform(),
        "python": sys.version.split()[0],
        "node": command_version(["node", "--version"]),
        "pnpm": command_version(["pnpm", "--version"]),
        "playwright": command_version(["pnpm", "exec", "playwright", "--version"]),
    }
    records: list[dict[str, object]] = []
    for check_id, category, slug, command in CHECKS:
        evidence_path = EVIDENCE_DIR / f"{check_id}-{slug}.log"
        command_text = shlex.join(command)
        begin = time.monotonic()
        try:
            result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, timeout=900)
            exit_code = result.returncode
            output = result.stdout + ("\n" + result.stderr if result.stderr else "")
            status = "PASS" if exit_code == 0 else "FAIL"
        except subprocess.TimeoutExpired as error:
            exit_code = None
            output = f"TIMEOUT after 900 seconds\nstdout={error.stdout}\nstderr={error.stderr}"
            status = "FAIL"
        except Exception as error:  # pragma: no cover - defensive quality runner path
            exit_code = None
            output = f"EXECUTION ERROR: {error!r}"
            status = "FAIL"
        duration_ms = round((time.monotonic() - begin) * 1000)
        evidence_path.write_text(output)
        records.append({
            "check_id": check_id,
            "category": category,
            "name": slug,
            "command": command_text,
            "exit_code": exit_code,
            "duration_ms": duration_ms,
            "status": status,
            "evidence_path": str(evidence_path.relative_to(ROOT)),
        })
        print(f"[{check_id}] {category}/{slug}: {status} exit={exit_code} duration_ms={duration_ms}")

    open_defects = defects()
    missing_evidence = [item["check_id"] for item in records if not (ROOT / str(item["evidence_path"])).is_file()]
    failed = [item["check_id"] for item in records if item["status"] != "PASS"]
    unexecuted = [item["check_id"] for item in records if item["exit_code"] is None]
    release_decision = "PASS" if not failed and not unexecuted and not missing_evidence and not open_defects else "BLOCKED"
    finished = datetime.now(timezone.utc)
    summary = {
        "quality_run": "unified-quality-check",
        "started_at": started.isoformat(),
        "finished_at": finished.isoformat(),
        "duration_ms": round((finished - started).total_seconds() * 1000),
        "environment": environment,
        "categories": ["Static", "Build", "Functional", "Visual", "Accessibility", "Release Decision"],
        "release_decision": release_decision,
        "failed_checks": failed,
        "unexecuted_checks": unexecuted,
        "missing_evidence": missing_evidence,
        "open_defects": [item.get("defect_id", "UNKNOWN") for item in open_defects],
        "checks_count": len(records),
    }
    (REPORT_DIR / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    (REPORT_DIR / "checks.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    with (REPORT_DIR / "defects.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["defect_id", "severity", "status", "description"])
        writer.writeheader()
        for item in open_defects:
            writer.writerow({key: item.get(key, "") for key in writer.fieldnames})
    lines = [
        "# Unified Quality Report",
        "",
        f"Release decision: **{release_decision}**",
        "",
        f"Run: `{started.isoformat()}` → `{finished.isoformat()}` ({summary['duration_ms']} ms)",
        f"Environment: {environment['platform']}; Node {environment['node']}; pnpm {environment['pnpm']}; Playwright {environment['playwright']}",
        "",
        "| Category | Check | Exit code | Duration (ms) | Status | Evidence |",
        "|---|---|---:|---:|---|---|",
    ]
    for item in records:
        lines.append(f"| {item['category']} | {item['name']} | {item['exit_code']} | {item['duration_ms']} | {item['status']} | `{item['evidence_path']}` |")
    lines.extend(["", "## Release Decision Inputs", "", f"- Failed checks: `{', '.join(failed) or 'none'}`", f"- Unexecuted checks: `{', '.join(unexecuted) or 'none'}`", f"- Missing evidence: `{', '.join(missing_evidence) or 'none'}`", f"- Open defects: `{', '.join(summary['open_defects']) or 'none'}`", "", "A required failure, unexecuted check, missing evidence, or open defect forces `BLOCKED`."])
    (REPORT_DIR / "QUALITY-REPORT.md").write_text("\n".join(lines) + "\n")
    print(f"release_decision={release_decision}")
    return 0 if release_decision == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
