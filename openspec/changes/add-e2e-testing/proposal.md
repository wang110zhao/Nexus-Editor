# Change: Add end-to-end tests for the Electron demo (Playwright)

## Why

`EditorAPI` and the live-preview pipeline are exercised by unit tests
(`apps/electron-demo/test/*.test.ts` cover `app-handlers`, `editor-shell`,
`link-index`, etc.), but **nothing drives the real Electron app end to end**.
Two roadmap entries call this out directly:

- **ROADMAP #25 — End-to-end testing (P1, planned):** *"Candidate: Playwright
  against electron-demo"*.
- **ROADMAP #26 — CI/CD pipeline polish (P1, in-progress):** *"PR check / CI
  and publish workflow exist; missing e2e gate"*.

Without an e2e gate, regressions in the highest-risk surfaces — the
live-preview decorations (CLAUDE.md documents *twelve* table-widget rules
because this code has broken repeatedly), the `vault.json` restore path, and
the save-to-disk path — can ship unnoticed. This change closes that gap.

This is **repository infrastructure, not a product capability**: it adds a CI
job and a test suite and touches no runtime/production code.

## What Changes

- **New Playwright suite** under `apps/electron-demo/e2e/`:
  - `fixtures.ts` — launches the real built app via Playwright's `_electron`
    API, seeds a throwaway vault (and `userData/vault.json` so the app's
    *real* restore path is exercised), and exposes `openFile()`.
  - `editor-core.spec.ts` — boot/vault-restore, open-file-from-tree, dirty
    flag + live word-count stats, **Save button writes to disk and clears
    dirty**, markdown source preserved verbatim.
  - `vault-navigation.spec.ts` — tree lists files, switching the active
    document, per-file edit isolation.
  - `live-preview.spec.ts` — heading marker hide/reveal on cursor, GFM table
    widget, task-list checkbox rendering.
- **`apps/electron-demo/playwright.config.ts`** (new) — `playwright.config.ts`
  with a single worker, `trace: retain-on-failure`, and screenshot on failure.
- **`apps/electron-demo/package.json`** — add `@playwright/test` to
  `devDependencies` and a `test:e2e` script (`pnpm run build && playwright test`).
- **Root `package.json`** — add a `test:e2e` script that delegates to the
  electron-demo package.
- **`.github/workflows/ci.yml`** — add an `e2e` job (ubuntu + `xvfb`) that
  installs, builds the workspace packages, and runs the suite; uploads the
  Playwright report on failure.
- **`.gitignore`** — ignore `playwright-report/` and `test-results/`.
- **No production code changes.** The suite drives the app purely through its
  real UI and the existing `vault.json` restore path; no test-only branch is
  added to `main.ts` or the renderer.

## Impact

- Affected specs:
  - `e2e-testing` (NEW) — boot/restore, document open, edit/save, vault
    navigation, live-preview rendering.
- Affected code (test/CI only):
  - `apps/electron-demo/` (`e2e/`, `playwright.config.ts`, `package.json`).
  - Root `package.json` (`test:e2e` script).
  - `.github/workflows/ci.yml` (new `e2e` job).
  - `.gitignore` (e2e artifacts).
- New external dependencies: `@playwright/test` (dev only; resolved from the
  existing registry, no runtime/bundle impact on the shipped app).
- Out of scope (explicit non-goals):
  - Visual / screenshot regression (pixel diffing).
  - A cross-platform runner matrix (macOS / Windows self-hosted runners).
  - Performance budgets (e.g. editor open-time assertions).
