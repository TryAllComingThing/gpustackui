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
    "src/app/router/routes.ts",
    "src/app/router/route-meta.d.ts",
    "src/app/navigation/nav.ts",
    "src/api/README.md",
    "src/api/index.ts",
    "src/api/resources/index.ts",
    "src/api/resources/gpu-device.ts",
    "src/api/auth/index.ts",
    "src/api/auth/auth.ts",
    "src/api/auth/user.ts",
    "src/app/router/access.ts",
    "src/services/auth/permissions.ts",
    "src/components/layout/AppShell.vue",
    "src/components/layout/AppHeaderActions.vue",
    "src/components/common/UBreadcrumb.vue",
    "src/components/common/UDataTable.vue",
    "src/components/common/USidebarNav.vue",
    "src/components/feedback/EmptyState.vue",
    "src/components/feedback/ErrorState.vue",
    "src/components/feedback/LoadingState.vue",
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


def source_files(path: Path):
    for file_path in iter_files(path):
        if file_path.suffix.lower() in {".vue", ".ts", ".js", ".mjs"}:
            yield file_path


def check_source_hygiene() -> None:
    empty_dirs = [str(path.relative_to(ROOT)) for path in (ROOT / "src").rglob("*") if path.is_dir() and not any(path.iterdir())]
    gitkeep_files = [str(path.relative_to(ROOT)) for path in (ROOT / "src").rglob(".gitkeep")]
    if empty_dirs:
        fail(f"empty source directories: {empty_dirs}")
    if gitkeep_files:
        fail(f"source .gitkeep placeholders are not allowed: {gitkeep_files}")
    if (ROOT / "src/components/ui").exists():
        fail("src/components/ui is not an allowed parallel primitive layer")
    if (ROOT / "src/services/schemas").exists():
        fail("domain schemas belong in src/api, not src/services/schemas")


def check_module_slices() -> None:
    modules_root = ROOT / "src/modules"
    for module in sorted(path for path in modules_root.iterdir() if path.is_dir() and not path.name.startswith("_")):
        if not (module / "pages").is_dir():
            fail(f"module is missing pages/: {module.relative_to(ROOT)}")
        routes = module / "routes.ts"
        if not routes.is_file():
            fail(f"module is missing routes.ts: {module.relative_to(ROOT)}")
        if not (module / "index.ts").is_file():
            fail(f"module is missing public index.ts: {module.relative_to(ROOT)}")
        text = routes.read_text(encoding="utf-8")
        for token in ("titleKey", "breadcrumbKeys", "nav:"):
            if token not in text:
                fail(f"module route metadata is incomplete: {routes.relative_to(ROOT)} missing {token}")


def check_dependency_direction() -> None:
    for file_path in source_files(ROOT / "src/api"):
        text = file_path.read_text(encoding="utf-8", errors="ignore")
        if "modules/" in text or "components/" in text:
            fail(f"src/api must not depend on modules or components: {file_path.relative_to(ROOT)}")

    for file_path in source_files(ROOT / "src/components"):
        text = file_path.read_text(encoding="utf-8", errors="ignore")
        if "modules/" in text:
            fail(f"src/components must not depend on business modules: {file_path.relative_to(ROOT)}")

    for module in sorted(path for path in (ROOT / "src/modules").iterdir() if path.is_dir() and not path.name.startswith("_")):
        for file_path in source_files(module):
            text = file_path.read_text(encoding="utf-8", errors="ignore")
            if "services/schemas/" in text or "components/ui/" in text:
                fail(f"module uses a retired path: {file_path.relative_to(ROOT)}")
            for imported_module in re.findall(r"from\s+['\"](?:\.\./)+modules/([^/'\"]+)", text):
                if imported_module != module.name:
                    fail(f"cross-module private import: {file_path.relative_to(ROOT)} -> {imported_module}")


def check_app_composition() -> None:
    router = (ROOT / "src/app/router/index.ts").read_text(encoding="utf-8")
    if "appRoutes" not in router or "./routes" not in router:
        fail("router must compose module routes through src/app/router/routes.ts")
    app = (ROOT / "src/App.vue").read_text(encoding="utf-8")
    for token in ("routeNavKey", "themeRegistry", "production-theme"):
        if token in app:
            fail(f"App.vue still owns app navigation or header controls: {token}")


def main() -> None:
    missing = [path for path in REQUIRED if not (ROOT / path).is_file()]
    if missing:
        fail(f"missing required paths: {', '.join(missing)}")

    check_source_hygiene()
    check_module_slices()
    check_dependency_direction()
    check_app_composition()

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
