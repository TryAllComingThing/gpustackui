#!/usr/bin/env python3
"""Validate repository contracts, skill contracts, and package script targets."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILLS = (
    "gpustack-design-system",
    "gpustack-page-migration",
    "gpustack-release-gate",
    "gpustack-repo-audit",
    "gpustack-visual-qa",
)
REQUIRED_PATHS = (
    "AGENTS.md",
    "DESIGN.md",
    "README.md",
    "docs/README.md",
    "docs/architecture/ARCHITECTURE.md",
    "docs/design/COMPONENT-MATRIX.md",
    "docs/design/FRAMEWORK-GUIDE.md",
    "docs/design/THEME-CONTRACT.md",
    "docs/design/TOKEN-MAPPING.md",
    "docs/quality/QUALITY-GATES.md",
    "scripts/README.md",
    "src/theme/tokens/SEMANTIC_MAPPING.json",
    "src/theme/tokens/COMPONENT_MAPPING.json",
)
REQUIRED_PACKAGE_SCRIPTS = (
    "check:structure",
    "check:showcase-isolation",
    "check:theme-css",
    "quality:check",
    "validate:design-contract",
    "validate:tokens",
)
DIRECT_PATH = re.compile(
    r"(?<!\S)((?:scripts|quality|tests|showcase|src)/[^\s'\";&|]+|[A-Za-z0-9_.-]+\.config\.ts)"
)


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def validate_skills() -> None:
    contracts = sorted((ROOT / ".codex/skills").glob("*/contract.json"))
    if len(contracts) != len(SKILLS):
        fail(f"expected {len(SKILLS)} skill contracts, found {len(contracts)}")

    names: set[str] = set()
    for contract_path in contracts:
        folder = contract_path.parent
        contract = json.loads(contract_path.read_text(encoding="utf-8"))
        name = contract.get("name")
        if not isinstance(name, str) or not re.fullmatch(r"gpustack-[a-z0-9-]+", name):
            fail(f"invalid contract name in {contract_path}")
        if name != folder.name:
            fail(f"contract/folder mismatch: {contract_path}")
        if name not in SKILLS:
            fail(f"unexpected skill contract: {name}")
        if name in names:
            fail(f"duplicate skill name: {name}")
        names.add(name)
        if not isinstance(contract.get("version"), str) or not contract["version"]:
            fail(f"missing version for {name}")
        if not contract.get("inputs") or not contract.get("outputs") or not contract.get("gates"):
            fail(f"contract inputs/outputs/gates must be non-empty for {name}")
        if contract.get("constraints", {}).get("require_real_evidence") is not True:
            fail(f"real-evidence constraint missing for {name}")
        if name == "gpustack-design-system" and not {"typecheck", "unit", "visual", "accessibility"} <= set(contract["gates"]):
            fail("design-system contract is missing a required gate")

        skill_path = folder / "SKILL.md"
        text = skill_path.read_text(encoding="utf-8")
        if not text.startswith("---\n") or f"\nname: {name}\n" not in text:
            fail(f"SKILL.md front matter mismatch for {name}")
        if "DESIGN.md" not in text or "exit code" not in text.lower():
            fail(f"SKILL.md must reference DESIGN.md and real evidence for {name}")
        if "Never self-approve" not in text:
            fail(f"SKILL.md must forbid self-approval for {name}")

        for output in contract.get("outputs", []):
            if not isinstance(output, str) or not output.endswith((".md", ".json")):
                fail(f"invalid output declaration for {name}: {output}")

    if names != set(SKILLS):
        fail(f"skill contract set mismatch: {sorted(names)}")


def validate_package_scripts(package: dict) -> None:
    scripts = package.get("scripts", {})
    for name in REQUIRED_PACKAGE_SCRIPTS:
        if name not in scripts:
            fail(f"package.json is missing required script: {name}")

    missing_targets: list[str] = []
    for name, command in scripts.items():
        for nested in re.findall(r"\bnpm run ([A-Za-z0-9:_.-]+)", command):
            if nested not in scripts:
                fail(f"package script {name} calls missing script {nested}")
        for target in DIRECT_PATH.findall(command):
            target = target.rstrip(",:")
            if "*" in target or "$" in target:
                continue
            if not (ROOT / target).exists():
                missing_targets.append(f"{name} -> {target}")
    if missing_targets:
        fail("package scripts reference missing files: " + "; ".join(sorted(set(missing_targets))))


def main() -> None:
    missing = [path for path in REQUIRED_PATHS if not (ROOT / path).is_file()]
    if missing:
        fail(f"missing contract files: {', '.join(missing)}")

    design_files = sorted(
        path.relative_to(ROOT).as_posix()
        for path in ROOT.rglob("DESIGN.md")
        if "node_modules" not in path.parts and ".git" not in path.parts
    )
    if design_files != ["DESIGN.md"]:
        fail(f"DESIGN.md must be the only active design authority; found {design_files}")

    design = (ROOT / "DESIGN.md").read_text(encoding="utf-8")
    if "唯一活动设计规范" not in design:
        fail("DESIGN.md does not declare the single active authority")

    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    validate_package_scripts(package)
    validate_skills()

    print(f"PASS: {len(REQUIRED_PATHS)} contract paths, {len(SKILLS)} skill contracts, and package script targets")


if __name__ == "__main__":
    main()
