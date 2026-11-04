#!/usr/bin/env python3
"""Validate token contracts: primitive themes, generated CSS, semantic/component mappings, aliases, motion, and density."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRIMITIVE_THEMES = {"standard": "E", "business": "A2", "future": "D", "sky": "B", "ocean": "C"}
COLOR = re.compile(r"^#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$")
PRIMITIVE_GROUPS = {
    "brand": ("primary", "hover", "pressed", "accent", "light", "subtle"),
    "success": ("default", "pressed", "hover", "light", "background"),
    "warning": ("default", "pressed", "hover", "light", "background"),
    "danger": ("default", "pressed", "hover", "light", "background"),
    "info": ("default", "pressed", "hover", "light", "background"),
    "text": ("primary", "secondary", "tertiary", "muted", "disabled"),
    "border": ("default", "divider", "subtle"),
    "background": ("disabled", "canvas", "subtle", "default"),
}
THEME_FILES = ("A2", "B", "C", "D", "E")
REQUIRED_SEMANTIC = {
    "surface.canvas",
    "surface.default",
    "surface.subtle",
    "border.default",
    "text.primary",
    "text.secondary",
    "action.primary.default",
    "action.primary.hover",
    "action.primary.pressed",
    "feedback.success",
    "feedback.warning",
    "feedback.danger",
    "feedback.info",
}


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def validate_color(value: object, location: str) -> None:
    if not isinstance(value, str) or not COLOR.fullmatch(value):
        fail(f"{location} is not a valid color: {value!r}")


def resolve(path: str, theme: dict, semantic: dict[str, str] | None = None) -> bool:
    if semantic is not None and path in semantic:
        path = semantic[path]
    node: object = theme
    for part in path.split("."):
        if not isinstance(node, dict) or part not in node:
            return False
        node = node[part]
    return isinstance(node, str)


def validate_primitive_themes() -> None:
    schema = json.loads((ROOT / "src/theme/tokens/schema/primitive.schema.json").read_text(encoding="utf-8"))
    if set(schema.get("required", [])) < {"brand", "text", "border", "background", "alpha"}:
        fail("primitive schema is missing required token groups")
    if "hover" not in schema["$defs"]["brand"]["required"]:
        fail("primitive schema must require brand.hover")

    for theme, design_id in PRIMITIVE_THEMES.items():
        source_path = ROOT / f"src/theme/tokens/themes/{design_id}.json"
        data = json.loads(source_path.read_text(encoding="utf-8"))
        for group, keys in PRIMITIVE_GROUPS.items():
            if set(data.get(group, {})) != set(keys):
                fail(f"{source_path.name} {group} keys mismatch")
            for key in keys:
                validate_color(data[group][key], f"{source_path.name}:{group}.{key}")

        if len({data["brand"][key].upper() for key in ("primary", "hover", "pressed")}) != 3:
            fail(f"{theme} primary/hover/pressed states must be distinct")
        if data["brand"]["hover"] == data["brand"]["pressed"]:
            fail(f"{theme} hover must not reuse pressed")

        css = (ROOT / f"src/theme/styles/themes/{theme}.css").read_text(encoding="utf-8")
        expected = {
            "--gp-brand-g600": data["brand"]["primary"],
            "--gp-brand-g500": data["brand"]["hover"],
            "--gp-brand-g900": data["brand"]["pressed"],
            "--gp-brand-g400": data["brand"]["accent"],
            "--gp-brand-g300": data["brand"]["light"],
            "--gp-brand-g100": data["brand"]["subtle"],
        }
        for variable, value in expected.items():
            if f"{variable}: {value};" not in css:
                fail(f"{theme}.css does not match source for {variable}")
        if "--gp-primary-hover: var(--gp-brand-g500);" not in css:
            fail(f"{theme}.css primary hover is not canonical")

    print(f"PASS: validated {len(PRIMITIVE_THEMES)} primitive themes and generated CSS")


def validate_semantic_contract() -> None:
    themes = [json.loads((ROOT / f"src/theme/tokens/themes/{name}.json").read_text(encoding="utf-8")) for name in THEME_FILES]
    semantic = json.loads((ROOT / "src/theme/tokens/SEMANTIC_MAPPING.json").read_text(encoding="utf-8"))
    component = json.loads((ROOT / "src/theme/tokens/COMPONENT_MAPPING.json").read_text(encoding="utf-8"))

    missing = REQUIRED_SEMANTIC - set(semantic)
    if missing:
        fail(f"semantic mapping missing: {sorted(missing)}")
    if semantic.get("action.primary.hover") != "brand.hover":
        fail("action.primary.hover must map to brand.hover")
    if semantic.get("action.primary.pressed") != "brand.pressed":
        fail("action.primary.pressed must map to brand.pressed")

    for theme_name, theme in zip(THEME_FILES, themes):
        for key, target in semantic.items():
            if not resolve(target, theme):
                fail(f"semantic target missing in {theme_name}: {key} -> {target}")

    for key, target in component.items():
        if target not in semantic and not target.startswith("brand."):
            fail(f"component mapping must target semantic/brand token: {key} -> {target}")
        for theme_name, theme in zip(THEME_FILES, themes):
            if not resolve(target, theme, semantic):
                fail(f"component target missing in {theme_name}: {key} -> {target}")

    tokens_css = (ROOT / "src/theme/styles/tokens.css").read_text(encoding="utf-8")
    if "--ds-" in tokens_css:
        fail("parallel --ds-* runtime namespace is forbidden")
    required_aliases = {
        "--gp-font-xl": "var(--gp-type-section-title-size)",
        "--gp-radius-tag": "var(--gp-radius-sm)",
        "--gp-icon-size-md": "20px",
        "--gp-menu-icon-size": "var(--gp-icon-size-md)",
        "--gp-layout-header-height": "var(--gp-header-height)",
        "--gp-motion-layout": "var(--gp-motion-standard)",
        "--gp-surface-raised": "var(--gp-background-n100)",
        "--gp-control-height-md": "var(--gp-control-height)",
        "--gp-table-row-height-md": "var(--gp-table-row-height)",
        "--gp-card-padding-md": "var(--gp-card-padding)",
        "--header-bg": "var(--gp-header-bg)",
    }
    for variable, value in required_aliases.items():
        if f"{variable}: {value};" not in tokens_css:
            fail(f"compatibility alias is not canonical: {variable}")

    if not re.search(r"@media \(prefers-reduced-motion: reduce\).*--gp-motion-standard: 0ms", tokens_css, re.S):
        fail("reduced-motion must zero the standard motion token")

    density = json.loads((ROOT / "src/theme/tokens/density.json").read_text(encoding="utf-8"))
    for preset, values in density["presets"].items():
        for key in ("controlHeight", "tableRowHeight", "cardPadding", "contentPadding"):
            if key not in values:
                fail(f"density preset {preset} is missing {key}")

    print("PASS: semantic/component mappings, compatibility aliases, motion, and density contract")


def main() -> None:
    validate_primitive_themes()
    validate_semantic_contract()


if __name__ == "__main__":
    main()
