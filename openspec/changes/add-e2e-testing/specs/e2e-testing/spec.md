# E2E Testing Spec — Playwright against the Electron demo

## ADDED Requirements

### Requirement: Boot restores the seeded vault

When the Electron demo launches with a `userData/vault.json` whose
`lastVault` points at an existing folder, the app SHALL restore that vault on
boot and SHALL render its file tree in the vault panel. The app SHALL NOT
auto-open any document — the editor starts empty and the user opens files from
the tree.

#### Scenario: Vault panel lists restored files
- **WHEN** the app boots with `vault.json` referencing a vault containing `index.md` and `notes.md`
- **THEN** `.nexus-vault-panel` SHALL be visible
- **AND** a tree row with `data-path` ending in `index.md` SHALL be visible
- **AND** a tree row with `data-path` ending in `notes.md` SHALL be visible
- **AND** `.cm-content` SHALL be visible (editor present, initially empty)

#### Scenario: No document is auto-opened
- **WHEN** the app has booted and restored the vault
- **THEN** the status line SHALL NOT show a file name until a tree row is clicked

### Requirement: Open file from the vault tree

Clicking a file row in the vault tree SHALL load that file's markdown into the
editor and SHALL update the status line to show the opened file's name.

#### Scenario: Clicking a tree row opens the document
- **WHEN** the row whose `data-path` ends in `index.md` is clicked
- **THEN** the status line SHALL contain `index.md`
- **AND** `.cm-content` SHALL contain the file's markdown text

### Requirement: Editing marks the document dirty and updates live stats

Typing into the editor SHALL set the document dirty flag (surfaced as
`[modified]` in the status line) and SHALL increase the live word-count
statistic.

#### Scenario: Typing flips the dirty flag and raises the word count
- **WHEN** a file is open and the user types an additional sentence
- **THEN** the status line SHALL contain `[modified]`
- **AND** the reported word count SHALL be greater than before the edit

### Requirement: Save persists to disk and clears the dirty flag

Pressing the toolbar **Save** button SHALL write the current editor buffer to
the vault file on disk and SHALL clear the `[modified]` flag.

#### Scenario: Save writes the buffer to disk
- **WHEN** the user types text, then clicks the button with accessible name `Save`
- **THEN** the status line SHALL NOT contain `[modified]`
- **AND** the file on disk SHALL contain the typed text

### Requirement: Markdown source is preserved verbatim

Saving an edited document SHALL preserve the original markdown source exactly;
the live-preview decorations SHALL NOT rewrite syntax the user did not touch.

#### Scenario: Verbatim round-trip
- **WHEN** a document starting with `# Index` is opened, appended to, and saved
- **THEN** the file on disk SHALL start with `# Index`
- **AND** the file on disk SHALL contain the appended text

### Requirement: Per-file edits are isolated

Switching between documents in the vault SHALL keep each file's content and
edits independent; saving one file SHALL NOT alter another.

#### Scenario: Editing and saving two files independently
- **WHEN** `index.md` is edited and saved, then `notes.md` is opened, edited, and saved
- **THEN** `index.md` on disk SHALL contain the `index.md` edit and SHALL NOT contain the `notes.md` edit
- **AND** `notes.md` on disk SHALL contain the `notes.md` edit and SHALL NOT contain the `index.md` edit

### Requirement: Live preview renders headings, tables, and task lists

With live preview enabled (the demo default), the editor SHALL render heading
markers that hide when the cursor is away and reveal when the cursor is on the
line, SHALL render a GFM table as a real `<table>` widget, and SHALL render a
`- [ ]` task item as a checkbox.

#### Scenario: Heading marker hides when the cursor is away
- **WHEN** a heading `# Heading one` is rendered and the cursor is moved away from that line
- **THEN** the visible text of the heading line SHALL be `Heading one`
- **AND** the visible text of the heading line SHALL NOT contain `# Heading one`

#### Scenario: Heading marker reveals when the cursor enters the line
- **WHEN** the cursor is moved onto the heading line
- **THEN** the visible text of the heading line SHALL contain `# Heading one`

#### Scenario: GFM table renders as a widget
- **WHEN** a GFM table is rendered in the editor
- **THEN** `.cm-content` SHALL contain exactly one `table` element
- **AND** at least one `td` cell SHALL be visible

#### Scenario: Task list renders a checkbox
- **WHEN** a `- [ ] pending task` item is rendered
- **THEN** `.cm-content` SHALL contain exactly one `input[type="checkbox"]`
