#!/usr/bin/env python3
"""Validate the SaaS-only visual foundation asset without GPU runtime mapping."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []
HEX = re.compile(r"^#[0-9A-Fa-f]{6,8}$")
PX = re.compile(r"^[0-9]+px$")


def require(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


try:
    source = json.loads((ROOT / "src/theme/tokens/visual-foundation.json").read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError) as exc:
    print(f"FAIL: visual foundation JSON cannot be loaded: {exc}")
    sys.exit(1)

require(source.get("status") == "APPROVED", "visual foundation status must be APPROVED")
require(source.get("scope") == "SaaS generic visual foundation; no GPU runtime mapping", "visual foundation scope must exclude GPU runtime mapping")
require(source.get("radius", {}).get("A2") == {"sm": "4px", "md": "6px", "lg": "10px", "xl": "14px"}, "A2 radius mismatch")
require(source.get("radius", {}).get("B") == {"sm": "6px", "md": "10px", "lg": "14px", "xl": "18px"}, "B radius mismatch")
require(source.get("radius", {}).get("C") == {"sm": "2px", "md": "4px", "lg": "8px", "xl": "12px"}, "C radius mismatch")
require(source.get("radius", {}).get("D") == {"sm": "6px", "md": "12px", "lg": "16px", "xl": "20px"}, "D radius mismatch")
require(source.get("radius", {}).get("E") == {"sm": "4px", "md": "8px", "lg": "12px", "xl": "16px"}, "E radius mismatch")
require(source.get("shadow") == {"elevation0": "none", "elevation1": "0 1px 3px rgba(0, 0, 0, 0.08)", "elevation2": "0 8px 24px rgba(0, 0, 0, 0.12)", "elevation3": "0 16px 48px rgba(0, 0, 0, 0.18)"}, "shadow scale mismatch")
require(source.get("motion", {}).get("standard") == "160ms" and source.get("motion", {}).get("overlay") == "200ms" and source.get("motion", {}).get("reduced") == "0ms", "motion scale mismatch")
require(source.get("icon") == {"family": "Lucide", "lineWidth": 2, "sizes": {"xs": "14px", "sm": "16px", "md": "20px", "lg": "24px"}}, "icon contract mismatch")
require(source.get("layout", {}).get("breakpoints") == {"sm": "768px", "md": "1024px", "lg": "1280px", "xl": "1600px"}, "breakpoint mismatch")
require(source.get("layout", {}).get("zIndex") == {"base": 0, "header": 20, "sidebar": 30, "popover": 40, "modal": 50, "toast": 60}, "z-index mismatch")
for theme, palette in source.get("dataViz", {}).items():
    for name, colors in palette.items():
        if name == "semantic":
            colors = list(colors.values())
        require(len(colors) in {5, 6, 7, 12}, f"{theme}.{name} has unexpected length")
        require(all(isinstance(value, str) and bool(HEX.fullmatch(value)) for value in colors), f"{theme}.{name} contains invalid color")
require("--gp-" not in (ROOT / "src/theme/tokens/visual-foundation.json").read_text(encoding="utf-8", errors="replace"), "SaaS visual foundation must not contain GPU runtime variables")

if errors:
    print(f"FAIL: {len(errors)} SaaS visual foundation violation(s)")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)
print("PASS: SaaS visual foundation, theme-derived DataViz palettes and GPU mapping boundary validated")
