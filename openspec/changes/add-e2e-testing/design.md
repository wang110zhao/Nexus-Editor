## Context

The Electron demo (`apps/electron-demo`) is the project's only end-to-end
surface: it mounts `@floatboat/nexus-core` with the full plugin set (gfm,
history, toolbar, search, slash, wordcount) and the live-preview pipeline,
and it reads/writes a real vault on disk. ROADMAP #25 and #26 both call for
automated E2E against it, but the repo only has vitest unit tests that stub
the renderer. The live-preview decorations (heading hide/reveal, the GFM
table widget, task-list checkboxes) are rebuilt on every selection change and
have historically regressed — exactly the kind of behaviour unit tests miss
but a real window catches.

## Goals / Non-Goals

- **Goals**
  - Drive the *real built app* in a real Chromium window (via Playwright's
    `_electron`), not a jsdom shim.
  - Cover the four highest-risk user journeys: boot/vault-restore, open-file,
    edit+save-to-disk, and live-preview rendering.
  - Land a CI gate (`e2e` job) so regressions fail PR checks.
  - Touch **zero production code** — the suite exercises shipping behaviour.
- **Non-Goals**
  - Visual / screenshot diffing (too flaky for a first cut).
  - macOS / Windows self-hosted runner matrix (infra beyond scope).
  - Performance budgets (editor open-time assertions).

## Decisions

### Decision 1: No production-code changes

The app already restores `lastVault` from `userData/vault.json` on boot
(`electron/main.ts` → `readVaultState`, `src/renderer/app.ts` →
`tryRestoreLastVault`). Seeding that file in the test fixture drives the
**real** restore path — there is no need for a test-only auto-open branch.
This keeps the change purely additive (test + CI) and makes the tests honest.

### Decision 2: Playwright `_electron`, not a packaged build or a URL

`electron.launch({ args: [mainEntry, '--user-data-dir=…'] })` launches the
compiled `dist-electron/main.js` directly. We pass `--user-data-dir` so the
seeded `vault.json` lives in a throwaway temp dir (per test), which both
isolates runs and avoids polluting the developer's real app data. Launching
the source/main entry (not an `electron-builder` artifact) keeps the test
loop fast and debuggable.

### Decision 3: The app does NOT auto-open a document

Verified in `vault-panel.ts`: `openVault()` only lists the tree and writes
`vault.json`; it never loads a file into the editor. Therefore every spec
that needs editor content **clicks the tree row** via `openFile()` and waits
for `#status-line` to show the file name. This mirrors how a real user opens
a note and is a stronger assertion than assuming an auto-open.

### Decision 4: Save via the toolbar button, not Ctrl+S

`src/renderer/app.ts` binds only `Ctrl+F` (search); there is **no** Ctrl+S
binding. The Save button (`getByRole('button', { name: /^Save$/ })`) is the
only save path, so the dirty-flag / disk-write assertions click it. Asserting
via Ctrl+S would silently no-op and produce a false-negative test.

### Decision 5: Per-test throwaway vault + auto-accept dialogs

Each test gets a fresh temp vault (the app writes edits straight to disk, so
reusing `sample-vault/` would make runs order-dependent). `fixtures.ts`
auto-accepts the native "discard unsaved changes?" `confirm()` so switching
files never blocks on a dialog the headless run cannot dismiss.

### Decision 6: CI runs headless via xvfb on ubuntu

GitHub's runner is headless; `xvfb-run --auto-servernum pnpm test:e2e` provides
a virtual display. `playwright test` with `_electron` uses the workspace's
`electron` package (no separate browser download needed), so the job stays
fast. The `e2e` job builds the workspace packages first (`pnpm build`) because
the electron-demo `tsup` build bundles them and resolves their `dist/`.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Electron launch per test is slow (seconds each). | Few specs (11 cases); acceptable for a CI gate. Could share one app via `test.beforeAll` later if wall-clock becomes an issue. |
| Flaky focus/timing in a real window. | Single worker, 30s timeouts, `trace: retain-on-failure` for triage, explicit waits on `#status-line` after `openFile`. |
| Heading-marker hide is a decoration, not a DOM removal — selector must target visible text. | Assert on `.cm-line` *visible text* (`toContainText` / `not.toContainText`), not on raw source. |
| `@playwright/test` added to `devDependencies` must stay lockfile-consistent. | `pnpm install --lockfile-only` regenerated `pnpm-lock.yaml`; CI uses `--frozen-lockfile`. |

## Migration Plan

No migration. Test + CI only; no public API, no config schema, no data format
changes. Removing the suite is a pure file deletion.

## Open Questions

- Should the `e2e` job also run on `macOS`/`windows` runners to catch
  platform-specific `nexus-vault://` or `userData` path quirks? Deferred —
  ubuntu + xvfb covers the logic; platform matrix is an infra ask.
- Want a visual snapshot of the GFM table widget? Out of scope for v1 (flaky);
  could layer on `@playwright/test` screenshot comparisons later.
