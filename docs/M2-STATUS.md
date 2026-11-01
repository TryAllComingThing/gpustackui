# M2 Implementation Status
- Source: user-provided `GPUStack-Frontend-Engineering-v1.1.1.zip`; M1 accepted by user.
- Implemented: Nuxt UI Showcase integration candidate; three-theme semantic swatches; real UButton/UInput/UModal; mock table; theme persistence; Playwright test and isolated Vite config; token mapping; production artifact scan.
- M2-03 implemented: real Nuxt UI `UTable`, `UForm`/`UFormField`, `UInput`, `USelect`, `UNavigationMenu`, `UBreadcrumb` and `UPagination`; thin `DrpDataTable`, `DrpSidebarNav` and `DrpBreadcrumb` adapters; mock GPU resource table with empty/loading/sort/pagination/selection states; Zod form validation/submit/reset/disabled states; navigation expand/collapse/selection and breadcrumb verification.
- M2-04 implemented: independent Showcase component matrix (`showcase/component-matrix.ts`), stable `data-testid` markers, full color/typography/spacing/radius Token display, Header theme control with persistence/refresh recovery, memory-router-backed Showcase navigation, and 1440px/narrow viewport checks. Showcase remains fixture-only and outside the production entry.
- Verified dependency versions in the installed workspace: `@nuxt/ui` 4.12.0, Vue 3.5.44, Vite 6.4.5, Zod 3.25.76. Nuxt UI 4.12's standalone Vite setup requires Tailwind/Nuxt UI CSS imports; Showcase maps those variables to the GPUStack semantic tokens.
- Pending: clean dependency install, axe-core audit and visual screenshot baselines. No claim of M2 PASS.
- Source ZIP had `package-lock.json` and no `pnpm-lock.yaml` despite pnpm packageManager. Must reconcile lockfile on macOS and freeze pnpm lockfile.
- Run: `pnpm install`; `pnpm typecheck`; `pnpm typecheck:showcase`; `pnpm build`; `pnpm build:showcase`; `pnpm test:showcase`; `pnpm check:showcase-isolation`.
