#!/usr/bin/env python3
"""Run the F4 verification gate and write machine-readable evidence."""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

COMMANDS = [
    ("contracts", ["python3", "scripts/validate_contracts.py"]),
    ("typecheck", ["pnpm", "typecheck"]),
    ("typecheck_showcase", ["pnpm", "typecheck:showcase"]),
    ("lint", ["pnpm", "lint"]),
    ("unit", ["pnpm", "test:unit"]),
    ("build", ["pnpm", "build"]),
    ("build_showcase", ["pnpm", "build:showcase"]),
    ("e2e", ["pnpm", "test:e2e"]),
    ("showcase", ["pnpm", "test:showcase"]),
    ("accessibility", ["pnpm", "test:accessibility"]),
    ("visual", ["pnpm", "test:visual"]),
    ("strict", ["pnpm", "test:strict"]),
    ("showcase_isolation", ["pnpm", "check:showcase-isolation"]),
    ("diff_check", ["git", "diff", "--check"]),
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    started = datetime.now(timezone.utc).isoformat()
    evidence: list[dict[str, object]] = []
    for name, command in COMMANDS:
        result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
        output = (result.stdout + result.stderr)[-12000:]
        record = {"name": name, "command": " ".join(command), "exit_code": result.returncode, "output": output}
        evidence.append(record)
        print(f"[{name}] exit={result.returncode}")
        if result.returncode != 0:
            break
    passed = bool(evidence) and len(evidence) == len(COMMANDS) and all(item["exit_code"] == 0 for item in evidence)
    payload = {
        "stage": args.stage,
        "status": "PASS" if passed else "FAIL",
        "started_at": started,
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "environment": {"cwd": str(ROOT), "node": os.environ.get("NODE_VERSION", "system"), "platform": sys.platform},
        "checks": evidence,
    }
    output = ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(f"gate={payload['status']} evidence={output}")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
