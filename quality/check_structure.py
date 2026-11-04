#!/usr/bin/env python3
"""Check repository structure, naming convergence, and required runtime entry points."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THEME_IDS = {"standard", "business", "future", "sky", "ocean"}
REQUIRED = (
    "index.html",
    "src/main.ts",
    "src/App.vue",
    "src/app/router/index.ts",
    "src/components/layout/AppShell.vue",
    "src/components/common/UBreadcrumb.vue",
    "src/components/common/UDataTable.vue",
    "src/components/common/USidebarNav.vue",
    "src/theme/index.css",
    "src/theme/styles/tokens.css",
    "src/theme/styles/nuxt-ui.bridge.css",
    "showcase/index.html",
    "showcase/main.ts",
    "showcase/App.vue",
)
SCAN_ROOTS = ("src", "showcase", "docs", "components.d.ts", "DESIGN.md", "README.md")
EXCLUDED_PARTS = {"node_modules", "dist", "dist-showcase", "playwright-report-strict"}


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def iter_files(path: Path):
    if path.is_file():
        yield path
        return
    for child in path.rglob("*"):
        if child.is_file() and not (set(child.parts) & EXCLUDED_PARTS):
            yield child


def main() -> None:
    missing = [path for path in REQUIRED if not (ROOT / path).is_file()]
    if missing:
        fail(f"missing required paths: {', '.join(missing)}")

    theme_sources = sorted((ROOT / "src/theme/tokens/themes").glob("*.json"))
    if len(theme_sources) != 5:
        fail(f"expected 5 primitive theme sources, found {len(theme_sources)}")

    generated = sorted((ROOT / "src/theme/styles/themes").glob("*.css"))
    if {path.stem for path in generated} != THEME_IDS:
        fail(f"generated theme set mismatch: {[path.stem for path in generated]}")

    old_prefix = re.compile(r"\b(?:drp|Drp)[A-Za-z0-9_-]*\b|\bdrp-", re.IGNORECASE)
    violations: list[str] = []
    for root_name in SCAN_ROOTS:
        for file_path in iter_files(ROOT / root_name):
            if file_path.suffix.lower() not in {".vue", ".ts", ".js", ".mjs", ".css", ".json", ".md", ".d.ts"}:
                continue
            for line_number, line in enumerate(file_path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
                if old_prefix.search(line):
                    violations.append(f"{file_path.relative_to(ROOT)}:{line_number}")
    if violations:
        fail(f"legacy Drp/drp naming remains: {violations[:10]}")

    router = (ROOT / "src/app/router/index.ts").read_text(encoding="utf-8")
    if "showcase" in router.lower():
        fail("production router references showcase")

    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    critical_scripts = (
        "check:structure",
        "check:showcase-isolation",
        "check:theme-css",
        "validate:design-contract",
        "validate:tokens",
    )
    for name in critical_scripts:
        command = package.get("scripts", {}).get(name, "")
        match = re.search(r"(?:python3|node)\s+([^\s]+)", command)
        if not match or not (ROOT / match.group(1)).is_file():
            fail(f"required quality script is missing or broken: {name}")

    print(f"PASS: structure, {len(theme_sources)} theme sources, {len(generated)} generated themes, naming convergence")


if __name__ == "__main__":
    main()
