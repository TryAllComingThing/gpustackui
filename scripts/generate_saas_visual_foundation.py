#!/usr/bin/env python3
"""Generate the approved SaaS visual-foundation source asset.

This source asset is intentionally independent from GPU runtime CSS. It fills
the generic SaaS contract; GPU mapping remains a separate, explicitly scoped
decision.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/theme/tokens/themes"
OUTPUTS = [ROOT / "src/theme/tokens/visual-foundation.json"]
RADIUS = {
    "A2": {"sm": "4px", "md": "6px", "lg": "10px", "xl": "14px"},
    "B": {"sm": "6px", "md": "10px", "lg": "14px", "xl": "18px"},
    "C": {"sm": "2px", "md": "4px", "lg": "8px", "xl": "12px"},
    "D": {"sm": "6px", "md": "12px", "lg": "16px", "xl": "20px"},
    "E": {"sm": "4px", "md": "8px", "lg": "12px", "xl": "16px"},
}


def dataviz(theme: dict) -> dict:
    brand, info = theme["brand"], theme["info"]
    success, warning, danger = theme["success"], theme["warning"], theme["danger"]
    text, background = theme["text"], theme["background"]
    return {
        "categorical6": [brand["primary"], info["default"], success["default"], warning["default"], danger["default"], text["tertiary"]],
        "categorical12": [brand["primary"], brand["accent"], brand["pressed"], info["default"], success["default"], warning["default"], danger["default"], text["tertiary"], info["hover"], success["hover"], warning["hover"], danger["hover"]],
        "sequential5": [brand["subtle"], brand["light"], brand["accent"], brand["primary"], brand["pressed"]],
        "diverging7": [danger["default"], danger["light"], warning["light"], background["default"], info["light"], info["default"], brand["primary"]],
        "semantic": {"brand": brand["primary"], "success": success["default"], "warning": warning["default"], "danger": danger["default"], "info": info["default"]},
        "neutral": [background["canvas"], background["subtle"], text["disabled"], text["muted"], text["tertiary"], text["secondary"], text["primary"]],
    }


def main() -> None:
    themes = {theme: json.loads((SOURCE / f"{theme}.json").read_text(encoding="utf-8")) for theme in RADIUS}
    asset = {
        "$schema": "https://gpustack.local/schema/visual-foundation.json",
        "status": "APPROVED",
        "scope": "SaaS generic visual foundation; no GPU runtime mapping",
        "source": "Migrated SaaS-Design-System-V1.1-M0/DESIGN.md §§5-10; src/theme/tokens/themes/A2,B,C,D,E.json",
        "radius": RADIUS,
        "shadow": {
            "elevation0": "none",
            "elevation1": "0 1px 3px rgba(0, 0, 0, 0.08)",
            "elevation2": "0 8px 24px rgba(0, 0, 0, 0.12)",
            "elevation3": "0 16px 48px rgba(0, 0, 0, 0.18)",
        },
        "motion": {
            "standard": "160ms",
            "overlay": "200ms",
            "reduced": "0ms",
            "easing": "cubic-bezier(0.2, 0, 0, 1)",
        },
        "icon": {"family": "Lucide", "lineWidth": 2, "sizes": {"xs": "14px", "sm": "16px", "md": "20px", "lg": "24px"}},
        "layout": {"breakpoints": {"sm": "768px", "md": "1024px", "lg": "1280px", "xl": "1600px"}, "zIndex": {"base": 0, "header": 20, "sidebar": 30, "popover": 40, "modal": 50, "toast": 60}},
        "dataViz": {theme: dataviz(themes[theme]) for theme in RADIUS},
    }
    encoded = json.dumps(asset, indent=2, ensure_ascii=False) + "\n"
    for output in OUTPUTS:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(encoded, encoding="utf-8")
    print(f"generated SaaS visual foundation for {len(RADIUS)} themes")


if __name__ == "__main__":
    main()
