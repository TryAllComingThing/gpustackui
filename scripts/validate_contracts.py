#!/usr/bin/env python3
"""Validate the GPUStack design-system skill contract and its local assets.

This is intentionally a deterministic, dependency-free check. It validates the
contract metadata, required design outputs, five theme source/runtime parity,
the --gp-* runtime namespace, and the configured verification gates.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / ".codex/skills/gpustack-design-system/contract.json"

EXPECTED_THEME_MAP = {
    "standard": "E",
    "business": "A2",
    "future": "D",
    "sky": "B",
    "ocean": "C",
}
REQUIRED_SOURCE_KEYS = {
    "brand": {"primary", "pressed", "accent", "light", "subtle"},
    "success": {"default", "pressed", "hover", "light", "background"},
    "warning": {"default", "pressed", "hover", "light", "background"},
    "danger": {"default", "pressed", "hover", "light", "background"},
    "info": {"default", "pressed", "hover", "light", "background"},
    "text": {"primary", "secondary", "tertiary", "muted", "disabled"},
    "border": {"default", "divider", "subtle"},
    "background": {"disabled", "canvas", "subtle", "default"},
    "alpha": {"black", "white"},
}
CSS_VARIABLES = {
    "brand.primary": "--gp-brand-g600",
    "brand.pressed": "--gp-brand-g900",
    "brand.accent": "--gp-brand-g400",
    "brand.light": "--gp-brand-g300",
    "brand.subtle": "--gp-brand-g100",
    "success.default": "--gp-success-default",
    "success.pressed": "--gp-success-pressed",
    "success.hover": "--gp-success-hover",
    "success.light": "--gp-success-light",
    "success.background": "--gp-success-bg",
    "warning.default": "--gp-warning-default",
    "warning.pressed": "--gp-warning-pressed",
    "warning.hover": "--gp-warning-hover",
    "warning.light": "--gp-warning-light",
    "warning.background": "--gp-warning-bg",
    "danger.default": "--gp-danger-default",
    "danger.pressed": "--gp-danger-pressed",
    "danger.hover": "--gp-danger-hover",
    "danger.light": "--gp-danger-light",
    "danger.background": "--gp-danger-bg",
    "info.default": "--gp-info-default",
    "info.pressed": "--gp-info-pressed",
    "info.hover": "--gp-info-hover",
    "info.light": "--gp-info-light",
    "info.background": "--gp-info-bg",
    "text.primary": "--gp-text-n900",
    "text.secondary": "--gp-text-n800",
    "text.tertiary": "--gp-text-n600",
    "text.muted": "--gp-text-n500",
    "text.disabled": "--gp-text-n400",
    "border.default": "--gp-line-n300",
    "border.divider": "--gp-line-n250",
    "border.subtle": "--gp-line-n200",
    "background.disabled": "--gp-background-disabled",
    "background.canvas": "--gp-background-n150",
    "background.subtle": "--gp-background-n100",
    "background.default": "--gp-surface-white",
}


class ContractErrors:
    def __init__(self) -> None:
        self.items: list[str] = []

    def require(self, condition: bool, message: str) -> None:
        if not condition:
            self.items.append(message)


def read_json(path: Path, errors: ContractErrors) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.items.append(f"{path.relative_to(ROOT)}: invalid JSON ({exc})")
        return {}


def nested_value(data: dict, path: str) -> object:
    value: object = data
    for key in path.split("."):
        if not isinstance(value, dict):
            return None
        value = value.get(key)
    return value


def parse_css_values(css: str) -> dict[str, str]:
    return {name: value.upper() for name, value in re.findall(r"(--gp-[\w-]+):\s*(#[0-9A-Fa-f]{6,8})", css)}


def validate_contract(errors: ContractErrors) -> None:
    contract = read_json(CONTRACT, errors)
    errors.require(isinstance(contract, dict), "contract.json must contain an object")
    if not isinstance(contract, dict):
        return

    for key in ("name", "version", "inputs", "constraints", "outputs", "gates"):
        errors.require(key in contract, f"contract.json missing top-level key: {key}")
    errors.require(contract.get("name") == "gpustack-design-system", "contract name mismatch")
    errors.require(isinstance(contract.get("inputs"), list), "contract.inputs must be a list")
    errors.require(isinstance(contract.get("outputs"), list), "contract.outputs must be a list")
    errors.require(isinstance(contract.get("gates"), list), "contract.gates must be a list")

    output_paths = {
        "TOKEN-MAPPING.md": ROOT / "docs/design/TOKEN-MAPPING.md",
        "THEME-CONTRACT.md": ROOT / "docs/design/THEME-CONTRACT.md",
        "COMPONENT-MATRIX.md": ROOT / "docs/design/COMPONENT-MATRIX.md",
        "THEME-TEST-REPORT.md": ROOT / "docs/design/THEME-TEST-REPORT.md",
    }
    for output in contract.get("outputs", []):
        path = output_paths.get(output)
        errors.require(path is not None, f"unmapped contract output: {output}")
        if path is not None:
            errors.require(path.is_file(), f"missing contract output: {path.relative_to(ROOT)}")
    evidence_report = output_paths["THEME-TEST-REPORT.md"]
    if contract.get("constraints", {}).get("require_real_evidence"):
        evidence_text = evidence_report.read_text(encoding="utf-8") if evidence_report.is_file() else ""
        errors.require("退出码 0" in evidence_text, "THEME-TEST-REPORT.md has no real command exit-code evidence")
        errors.require("待本次改动后执行" not in evidence_text, "THEME-TEST-REPORT.md still contains pending execution claims")

    input_assets = {
        "design_authority": [ROOT / "DESIGN.md", ROOT / "DESIGN.md"],
        "theme_contract": [ROOT / "docs/design/THEME-CONTRACT.md"],
        "component_matrix": [ROOT / "docs/design/COMPONENT-MATRIX.md", ROOT / "showcase/component-matrix.ts"],
    }
    for input_name in contract.get("inputs", []):
        assets = input_assets.get(input_name, [])
        errors.require(bool(assets), f"unmapped contract input: {input_name}")
        for asset in assets:
            errors.require(asset.is_file(), f"missing contract input asset: {asset.relative_to(ROOT)}")

    expected_gates = {"typecheck": "typecheck", "unit": "test:unit", "visual": "test:visual", "accessibility": "test:accessibility"}
    package = read_json(ROOT / "package.json", errors)
    scripts = package.get("scripts", {}) if isinstance(package, dict) else {}
    for gate in contract.get("gates", []):
        script_name = expected_gates.get(gate)
        errors.require(script_name is not None, f"unmapped contract gate: {gate}")
        if script_name:
            errors.require(script_name in scripts, f"package.json missing gate script: {script_name}")

    theme_types = ROOT / "src/theme/theme.types.ts"
    types_text = theme_types.read_text(encoding="utf-8") if theme_types.is_file() else ""
    # Match the complete identifier so DEFAULT_THEME_IDS is not mistaken for
    # the runtime list when the source keeps both declarations together.
    ids_match = re.search(r"(?<![A-Za-z0-9_])THEME_IDS\s*=\s*\[([^]]+)\]", types_text)
    ids = re.findall(r"['\"]([^'\"]+)['\"]", ids_match.group(1)) if ids_match else []
    errors.require(ids == list(EXPECTED_THEME_MAP), f"THEME_IDS mismatch: expected {list(EXPECTED_THEME_MAP)}, got {ids}")

    registry_text = (ROOT / "src/theme/theme.registry.ts").read_text(encoding="utf-8") if (ROOT / "src/theme/theme.registry.ts").is_file() else ""
    for theme, design_id in EXPECTED_THEME_MAP.items():
        errors.require(re.search(rf"{theme}:\s*\{{[^}}]*designId:\s*['\"]{design_id}['\"]", registry_text), f"registry missing {theme} designId {design_id}")

    source_data: dict[str, dict] = {}
    source_keys: set[str] | None = None
    for design_id in EXPECTED_THEME_MAP.values():
        path = ROOT / f"src/theme/tokens/themes/{design_id}.json"
        data = read_json(path, errors)
        errors.require(isinstance(data, dict), f"theme source must be an object: {path.relative_to(ROOT)}")
        if not isinstance(data, dict):
            continue
        source_data[design_id] = data
        keys = set(data)
        if source_keys is None:
            source_keys = keys
        errors.require(keys == source_keys, f"theme top-level key parity failed: {path.relative_to(ROOT)}")
        for group, required in REQUIRED_SOURCE_KEYS.items():
            errors.require(group in data, f"{path.relative_to(ROOT)} missing group {group}")
            if isinstance(data.get(group), dict):
                errors.require(set(data[group]) == required, f"{path.relative_to(ROOT)} key parity failed for {group}")


    for theme, design_id in EXPECTED_THEME_MAP.items():
        css_path = ROOT / f"src/theme/styles/themes/{theme}.css"
        errors.require(css_path.is_file(), f"missing runtime theme CSS: {css_path.relative_to(ROOT)}")
        if not css_path.is_file() or design_id not in source_data:
            continue
        css = css_path.read_text(encoding="utf-8")
        errors.require(f':root[data-theme="{theme}"]' in css, f"missing data-theme selector: {theme}")
        values = parse_css_values(css)
        for source_path, variable in CSS_VARIABLES.items():
            expected = nested_value(source_data[design_id], source_path)
            errors.require(variable in values, f"{theme} missing runtime variable {variable}")
            if isinstance(expected, str) and variable in values:
                errors.require(values[variable] == expected.upper(), f"{theme} {variable}={values[variable]} does not match {expected}")

    main_css = (ROOT / "src/theme/styles/main.css").read_text(encoding="utf-8") if (ROOT / "src/theme/styles/main.css").is_file() else ""
    for theme in EXPECTED_THEME_MAP:
        errors.require(f"./themes/{theme}.css" in main_css, f"main.css does not import {theme}.css")

    for path in [*ROOT.glob("src/**/*.ts"), *ROOT.glob("src/**/*.vue"), *ROOT.glob("src/**/*.css"), *ROOT.glob("showcase/**/*.ts"), *ROOT.glob("showcase/**/*.vue"), *ROOT.glob("showcase/**/*.css")]:
        text = path.read_text(encoding="utf-8", errors="replace")
        errors.require("--ds-" not in text, f"parallel --ds-* runtime token found: {path.relative_to(ROOT)}")


def main() -> int:
    errors = ContractErrors()
    validate_contract(errors)
    if errors.items:
        print(f"FAIL: {len(errors.items)} contract violation(s)")
        for item in errors.items:
            print(f"- {item}")
        return 1
    print("PASS: design-system contract, five-theme parity, runtime namespace and configured gates validated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
