#!/usr/bin/env python3
"""Set a stage state only from a real PASS gate and explicit approval record."""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", required=True)
    parser.add_argument("--gate", required=True)
    parser.add_argument("--approval", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    gate = json.loads((root / args.gate).read_text())
    approval = (root / args.approval).read_text()
    if gate.get("stage") != args.stage or gate.get("status") != "PASS":
        raise SystemExit("gate is not a valid PASS result")
    required = ("APPROVED", "小张", "2026-11-01")
    if not all(value in approval for value in required):
        raise SystemExit("approval record lacks required human approval evidence")
    payload = {"stage": args.stage, "status": "PASS", "gate": args.gate, "approval": args.approval}
    output = root / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(f"PASS: {args.stage} state recorded at {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
