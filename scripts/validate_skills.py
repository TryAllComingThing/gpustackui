#!/usr/bin/env python3
"""Validate the five repository Skills and their shared path/contract references."""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILLS = {
    "design-system": ROOT / ".codex/skills/gpustack-design-system/SKILL.md",
    "page-migration": ROOT / ".codex/skills/gpustack-page-migration/SKILL.md",
    "visual-qa": ROOT / ".codex/skills/gpustack-visual-qa/SKILL.md",
    "repo-audit": ROOT / ".codex/skills/gpustack-repo-audit/SKILL.md",
    "release-gate": ROOT / ".codex/skills/gpustack-release-gate/SKILL.md",
}
REQUIRED = ("DESIGN.md", "AGENTS.md", "Shared repository contract", "Decision rules", "Required deliverables")


def validate(name: str, path: Path) -> list[str]:
    errors: list[str] = []
    if not path.is_file():
        return [f"{name}: missing {path.relative_to(ROOT)}"]
    text = path.read_text()
    for marker in REQUIRED:
        if marker not in text:
            errors.append(f"{name}: missing marker {marker!r}")
    if "design-system/DESIGN.md" in text or "双层" in text or "GPUStack Profile" in text:
        errors.append(f"{name}: stale dual-layer/Profile reference")
    for ref in re.findall(r"`([^`]+)`", text):
        if ref.startswith(("src/", "showcase/", "tests/", "scripts/", "quality/", "docs/", "AGENTS.md", "DESIGN.md")):
            target = ROOT / ref
            if not target.exists() and not any(ch in ref for ch in "*?"):
                errors.append(f"{name}: missing referenced path {ref}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skill", choices=sorted(SKILLS), action="append")
    args = parser.parse_args()
    selected = args.skill or list(SKILLS)
    errors = [error for name in selected for error in validate(name, SKILLS[name])]
    if errors:
        print("\n".join(errors))
        return 1
    for name in selected:
        print(f"PASS: {name} structure and repository paths validated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
