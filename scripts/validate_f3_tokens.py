#!/usr/bin/env python3
"""Validate F3 visual token schema and runtime selector contracts."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


try:
    density = json.loads((ROOT / "src/theme/tokens/density.json").read_text(encoding="utf-8"))
    typography = json.loads((ROOT / "src/theme/tokens/typography.json").read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError) as exc:
    print(f"FAIL: token JSON cannot be loaded: {exc}")
    sys.exit(1)

require(density.get("status") == "APPROVED", "density.json status must be APPROVED")
require(density.get("independentFromTheme") is True, "density must declare independentFromTheme=true")
required_density = {"controlHeight", "tableRowHeight", "cardPadding", "fieldGap", "sectionGap", "filterGap", "headerHeight", "sidebarExpanded", "sidebarCollapsed", "contentPadding"}
for name in ("compact", "standard", "comfortable"):
    require(name in density.get("presets", {}), f"density preset missing: {name}")
    require(set(density.get("presets", {}).get(name, {})) >= required_density, f"density preset keys incomplete: {name}")

require(typography.get("status") == "APPROVED", "typography.json status must be APPROVED")
required_levels = {"display", "page-title", "section-title", "card-title", "body", "body-small", "caption", "numeric", "code"}
require(set(typography.get("levels", {})) == required_levels, "typography levels do not match the approved nine-level schema")
for level, value in typography.get("levels", {}).items():
    require(all(key in value for key in ("fontSize", "fontWeight", "lineHeight")), f"typography level incomplete: {level}")

tokens = (ROOT / "src/theme/styles/tokens.css").read_text(encoding="utf-8")
for name in ("compact", "standard", "comfortable"):
    require(f':root[data-density="{name}"]' in tokens, f"tokens.css missing data-density selector: {name}")
for variable in ("--gp-control-height-md", "--gp-table-row-height-md", "--gp-card-padding-md", "--gp-surface-canvas", "--gp-surface-default", "--gp-border-divider", "--gp-border-subtle", "--gp-text-tertiary", "--gp-text-muted", "--gp-text-disabled", "--gp-primary-accent", "--gp-primary-light", "--gp-type-numeric-variant", "--gp-type-code-family", "--gp-icon-size-sm", "--gp-icon-size-md", "--gp-icon-size-inline", "--gp-motion-standard", "--gp-motion-layout", "--gp-radius-interactive", "--gp-shadow-elevated", "--gp-chart-primary"):
    require(variable in tokens, f"F3 runtime variable missing: {variable}")

layout_css = (ROOT / "src/theme/styles/layout.css").read_text(encoding="utf-8")
for variable in ("--gp-z-header", "--gp-z-sidebar", "--gp-z-popover"):
    require(re.search(rf"var\({re.escape(variable)}(?:\s*,\s*[^)]+)?\)", layout_css) is not None, f"layout variable must have a token or explicit fallback: {variable}")

manager = (ROOT / "src/theme/density.manager.ts").read_text(encoding="utf-8")
require("dataset.density" in manager, "density manager must use data-density")
require("style.setProperty" not in manager, "density manager must not override CSS density variables inline")

for path in [*ROOT.glob("src/**/*.css"), *ROOT.glob("src/**/*.vue"), *ROOT.glob("src/**/*.ts")]:
    require("--ds-" not in path.read_text(encoding="utf-8", errors="replace"), f"parallel --ds-* variable found in {path.relative_to(ROOT)}")

if errors:
    print(f"FAIL: {len(errors)} F3 token contract violation(s)")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)
print("PASS: F3 token schema, data-density selectors, runtime aliases and namespace audit")
