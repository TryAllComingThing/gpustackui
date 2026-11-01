#!/usr/bin/env python3
"""Validate F2 primitive/semantic/component token keys and references."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEMES = ("A2", "B", "C", "D", "E")
errors: list[str] = []


def load(relative: str) -> object:
    try:
        return json.loads((ROOT / relative).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"{relative}: cannot load JSON ({exc})")
        return {}


def require(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


primitive = load("src/theme/tokens/schema/primitive.schema.json")
semantic_schema = load("src/theme/tokens/schema/semantic.schema.json")
component_schema = load("src/theme/tokens/schema/component.schema.json")
semantic = load("src/theme/tokens/SEMANTIC_MAPPING.json")
component = load("src/theme/tokens/COMPONENT_MAPPING.json")

groups = {
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
color = re.compile(r"^#[0-9A-Fa-f]{6,8}$")

require(isinstance(primitive, dict), "primitive schema must be an object")
require(isinstance(semantic_schema, dict), "semantic schema must be an object")
require(isinstance(component_schema, dict), "component schema must be an object")

primitive_paths: set[str] = set()
for theme in THEMES:
    data = load(f"src/theme/tokens/themes/{theme}.json")
    require(isinstance(data, dict), f"theme {theme} must be an object")
    if not isinstance(data, dict):
        continue
    require(set(data) == set(groups), f"theme {theme} top-level keys differ")
    for group, keys in groups.items():
        value = data.get(group)
        require(isinstance(value, dict) and set(value) == keys, f"theme {theme}.{group} key set differs")
        if not isinstance(value, dict):
            continue
        if group == "alpha":
            for tone, alpha_values in value.items():
                require(set(alpha_values) == {"90", "60", "30", "10", "5"}, f"theme {theme}.alpha.{tone} key set differs")
                for opacity, token in alpha_values.items():
                    require(isinstance(token, str) and bool(color.fullmatch(token)), f"invalid color: {theme}.alpha.{tone}.{opacity}")
                    primitive_paths.add(f"alpha.{tone}.{opacity}")
        else:
            for name, token in value.items():
                require(isinstance(token, str) and bool(color.fullmatch(token)), f"invalid color: {theme}.{group}.{name}")
                primitive_paths.add(f"{group}.{name}")

require(isinstance(semantic, dict), "semantic mapping must be an object")
require(isinstance(component, dict), "component mapping must be an object")
semantic_keys = set(semantic) if isinstance(semantic, dict) else set()
for name, source in (semantic.items() if isinstance(semantic, dict) else []):
    require(bool(re.fullmatch(r"^(surface|border|text|action|feedback)\.[a-zA-Z][a-zA-Z0-9.-]*$", name)), f"semantic key violates schema: {name}")
    require(bool(re.fullmatch(r"^[a-zA-Z][a-zA-Z0-9_.-]*$", source)) and source in primitive_paths, f"unresolved semantic reference: {name} -> {source}")
for name, source in (component.items() if isinstance(component, dict) else []):
    require(bool(re.fullmatch(r"^[a-z][a-z0-9.-]*\.[a-z][a-zA-Z0-9.-]*$", name)), f"component key violates schema: {name}")
    require(bool(re.fullmatch(r"^(surface|border|text|action|feedback|brand)\.[a-zA-Z][a-zA-Z0-9.-]*$", source)), f"component value violates schema: {name} -> {source}")
    require(source in semantic_keys or source in primitive_paths, f"unresolved component reference: {name} -> {source}")

if errors:
    print(f"FAIL: {len(errors)} F2 token schema/reference violation(s)")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)
print("PASS: F2 primitive schema, key sets and semantic/component references validated")
