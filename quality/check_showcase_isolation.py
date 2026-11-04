#!/usr/bin/env python3
"""Verify that Showcase remains local-fixture-only and outside production routes."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def main() -> None:
    router = (ROOT / "src/app/router/index.ts").read_text(encoding="utf-8")
    if "showcase" in router.lower():
        fail("showcase must not be registered in the production router")

    tsconfig = json.loads((ROOT / "tsconfig.json").read_text(encoding="utf-8"))
    includes = tsconfig.get("include", [])
    if any("showcase" in item for item in includes):
        fail("production TypeScript config includes showcase")

    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    scripts = package.get("scripts", {})
    if "showcase" in scripts.get("build", ""):
        fail("production build script includes showcase")
    if "showcase" not in scripts.get("build:showcase", ""):
        fail("showcase build script is not independent")

    showcase_files = [path for path in (ROOT / "showcase").rglob("*") if path.is_file()]
    forbidden = ("axios", "fetch(", "XMLHttpRequest", "/api/")
    violations: list[str] = []
    for path in showcase_files:
        if path.suffix.lower() not in {".vue", ".ts", ".js", ".mjs"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for token in forbidden:
            if token in text:
                violations.append(f"{path.relative_to(ROOT)} contains {token}")
    if violations:
        fail("showcase backend coupling: " + "; ".join(violations))

    if not (ROOT / "showcase/fixtures").is_dir():
        fail("showcase local fixtures directory is missing")

    print("PASS: showcase is isolated from production routes, production build, and backend calls")


if __name__ == "__main__":
    main()
