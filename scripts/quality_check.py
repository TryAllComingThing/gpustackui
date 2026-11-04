#!/usr/bin/env python3
"""Unified quality entry point with exit-code gating."""
from __future__ import annotations

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

CHECKS = [
    ("S-001", "Static", "contracts", ["python3", "scripts/validate_contracts.py"]),
    ("S-002", "Static", "structure", ["npm", "run", "check:structure"]),
    ("S-003", "Static", "typecheck", ["npm", "run", "typecheck"]),
    ("S-004", "Static", "typecheck-showcase", ["npm", "run", "typecheck:showcase"]),
    ("S-005", "Static", "lint", ["npm", "run", "lint"]),
    ("S-006", "Static", "theme-css", ["npm", "run", "check:theme-css"]),
    ("S-007", "Static", "tokens", ["npm", "run", "validate:tokens"]),
    ("S-008", "Static", "diff-check", ["git", "diff", "--check"]),
    ("B-001", "Build", "production-build", ["npm", "run", "build"]),
    ("B-002", "Build", "showcase-build", ["npm", "run", "build:showcase"]),
    ("F-001", "Functional", "unit", ["npm", "run", "test:unit"]),
    ("F-002", "Functional", "production-e2e", ["npm", "run", "test:e2e"]),
    ("V-001", "Visual", "visual", ["npm", "run", "test:visual"]),
    ("A-001", "Accessibility", "accessibility", ["npm", "run", "test:accessibility"]),
    ("A-002", "Accessibility", "strict-axe-browser-visual", ["npm", "run", "test:strict"]),
    ("A-003", "Accessibility", "showcase-isolation", ["npm", "run", "check:showcase-isolation"]),
]


def command_version(command: list[str]) -> str:
    try:
        result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, timeout=30)
        return (result.stdout or result.stderr).strip().splitlines()[0] if result.returncode == 0 else "UNKNOWN"
    except Exception:
        return "UNKNOWN"


def main() -> int:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    started = datetime.now(timezone.utc)
    environment = {
        "cwd": str(ROOT),
        "platform": platform.platform(),
        "python": sys.version.split()[0],
        "node": command_version(["node", "--version"]),
        "npm": command_version(["npm", "--version"]),
        "playwright": command_version(["npm", "exec", "--", "playwright", "--version"]),
    }
    records: list[dict[str, object]] = []
    for check_id, category, slug, command in CHECKS:
        command_text = shlex.join(command)
        begin = time.monotonic()
        try:
            result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, timeout=900)
            exit_code = result.returncode
            status = "PASS" if exit_code == 0 else "FAIL"
        except subprocess.TimeoutExpired:
            exit_code = None
            status = "FAIL"
        except Exception:  # pragma: no cover - defensive quality runner path
            exit_code = None
            status = "FAIL"
        duration_ms = round((time.monotonic() - begin) * 1000)
        records.append({
            "check_id": check_id,
            "category": category,
            "name": slug,
            "command": command_text,
            "exit_code": exit_code,
            "duration_ms": duration_ms,
            "status": status,
        })
        print(f"[{check_id}] {category}/{slug}: {status} exit={exit_code} duration_ms={duration_ms}")

    failed = [item["check_id"] for item in records if item["status"] != "PASS"]
    unexecuted = [item["check_id"] for item in records if item["exit_code"] is None]
    quality_decision = "PASS" if not failed and not unexecuted else "BLOCKED"
    finished = datetime.now(timezone.utc)
    summary = {
        "quality_run": "unified-quality-check",
        "started_at": started.isoformat(),
        "finished_at": finished.isoformat(),
        "duration_ms": round((finished - started).total_seconds() * 1000),
        "environment": environment,
        "categories": ["Static", "Build", "Functional", "Visual", "Accessibility"],
        "quality_decision": quality_decision,
        "failed_checks": failed,
        "unexecuted_checks": unexecuted,
        "checks_count": len(records),
    }
    (REPORT_DIR / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    (REPORT_DIR / "checks.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    lines = [
        "# Unified Quality Report",
        "",
        f"Quality decision: **{quality_decision}**",
        "",
        f"Run: `{started.isoformat()}` → `{finished.isoformat()}` ({summary['duration_ms']} ms)",
        f"Environment: {environment['platform']}; Node {environment['node']}; npm {environment['npm']}; Playwright {environment['playwright']}",
        "",
        "| Category | Check | Exit code | Duration (ms) | Status |",
        "|---|---|---:|---:|---|",
    ]
    for item in records:
        lines.append(f"| {item['category']} | {item['name']} | {item['exit_code']} | {item['duration_ms']} | {item['status']} |")
    lines.extend(["", "## Quality Decision Inputs", "", f"- Failed checks: `{', '.join(failed) or 'none'}`", f"- Unexecuted checks: `{', '.join(unexecuted) or 'none'}`", "", "A required failure or unexecuted check forces `BLOCKED`."])
    (REPORT_DIR / "QUALITY-REPORT.md").write_text("\n".join(lines) + "\n")
    print(f"quality_decision={quality_decision}")
    return 0 if quality_decision == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
