# Implementation Tasks

## 1. Test harness

- [x] 1.1 Add `apps/electron-demo/playwright.config.ts` (single worker,
  `trace: retain-on-failure`, screenshot on failure, 30s test timeout).
- [x] 1.2 Add `apps/electron-demo/e2e/fixtures.ts` that launches the built
  app via `@playwright/test`'s `_electron` API, seeds a per-test temp vault
  plus `userData/vault.json` (`{ lastVault, recents }`), and exposes
  `openFile(page, name)` which clicks the vault-tree row and waits for the
  status line to adopt the file name.
- [x] 1.3 In `fixtures.ts`, auto-accept the native "discard unsaved changes?"
  `confirm()` dialog so file switching never blocks the run.

## 2. Editor-core spec

- [x] 2.1 Boot + vault restore: assert `.nexus-vault-panel` is visible with a
  row per seeded file and `.cm-content` is present (editor starts empty — the
  app does **not** auto-open a document).
- [x] 2.2 Open-from-tree: clicking a tree row loads the file; `.cm-content`
  shows the file's markdown.
- [x] 2.3 Dirty + stats: typing flips the status line to `[modified]` and
  increases the live word count.
- [x] 2.4 Save-to-disk: the toolbar **Save** button (the app does not bind
  Ctrl+S) writes the buffer to disk, clears `[modified]`, and the on-disk file
  contains the typed text.
- [x] 2.5 Verbatim round-trip: after an edit + save, the on-disk file still
  starts with the original markdown heading/source.

## 3. Vault-navigation spec

- [x] 3.1 Tree lists files; opening `notes.md` switches the active document
  (status line + editor content update).
- [x] 3.2 Per-file isolation: editing + saving `index.md`, then switching to
  `notes.md`, editing + saving it, leaves both files with their own content
  (no cross-contamination).

## 4. Live-preview spec

- [x] 4.1 Heading marker hide: with the cursor away from the heading, the `#`
  prefix is decorated out (line text shows `Heading one`, not `# Heading one`).
- [x] 4.2 Heading marker reveal: moving the cursor onto the heading line shows
  the raw `# Heading one` again.
- [x] 4.3 GFM table widget: a `<table>` with visible `<td>` cells renders
  inside `.cm-content`.
- [x] 4.4 Task list: a `- [ ]` item renders an `<input type="checkbox">`.

## 5. Packaging & CI

- [x] 5.1 Add `@playwright/test` to `apps/electron-demo/package.json`
  `devDependencies` and a `test:e2e` script (`pnpm run build && playwright test`).
- [x] 5.2 Add a root `test:e2e` script delegating to the electron-demo.
- [x] 5.3 Add `playwright-report/` and `test-results/` to `.gitignore`.
- [x] 5.4 Update `pnpm-lock.yaml` so the frozen CI install stays consistent.
- [x] 5.5 Add an `e2e` job to `.github/workflows/ci.yml` (ubuntu + `xvfb-run`)
  that installs, builds the workspace packages, runs the suite, and uploads
  the Playwright report on failure.

## 6. OpenSpec

- [x] 6.1 `openspec/changes/add-e2e-testing/proposal.md`
- [x] 6.2 `openspec/changes/add-e2e-testing/tasks.md`
- [x] 6.3 `openspec/changes/add-e2e-testing/design.md`
- [x] 6.4 `openspec/changes/add-e2e-testing/specs/e2e-testing/spec.md`

## 7. Verify

- [x] 7.1 `pnpm test:e2e` is wired and the suite is green locally / in CI.
- [ ] 7.2 `openspec validate add-e2e-testing --strict` — CLI not installed in
  the dev environment; spec format hand-linted against `openspec/AGENTS.md`
  (each `### Requirement:` has at least one `#### Scenario:` with
  `**WHEN**`/`**THEN**` bullets; delta files use `## ADDED Requirements`).
