import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { _electron as electron, expect, test as base, type ElectronApplication, type Page } from "@playwright/test";

// This package has no "type": "module", so Playwright loads the specs as
// CommonJS; `import.meta.url` is unavailable there, but `__dirname` is.
const here = __dirname;
const appRoot = path.resolve(here, "..");
const mainEntry = path.join(appRoot, "dist-electron", "main.js");

export interface VaultFile {
  name: string;
  body: string;
}

export const INDEX_MD = "index.md";
export const NOTES_MD = "notes.md";

/**
 * Open a markdown file from the vault tree by clicking its row.
 *
 * The demo restores `lastVault` from `userData/vault.json` on boot, but the
 * vault panel does NOT auto-open any document — the tree row must be clicked
 * to load a file into the editor. We assert the status line picks up the file
 * name as the signal that the document actually loaded.
 */
export async function openFile(page: Page, name: string): Promise<void> {
  await page.locator(`[data-path$="${name}"]`).first().click();
  await expect(page.locator("#status-line")).toContainText(name);
}

interface Fixtures {
  vaultFiles: VaultFile[];
  vault: string;
  app: ElectronApplication;
  page: Page;
}

export const test = base.extend<Fixtures>({
  // Override in a spec via `test.use({ vaultFiles: [...] })` when a scenario
  // needs different markdown than the default two-file vault.
  vaultFiles: [
    [
      { name: INDEX_MD, body: "# Index\n\nWelcome to the vault.\n" },
      { name: NOTES_MD, body: "# Notes\n\n- first\n- second\n" },
    ],
    { option: true },
  ],

  vault: async ({ vaultFiles }, use) => {
    // A throwaway vault per test: the app writes edits straight to disk, so
    // pointing tests at `sample-vault/` would dirty the working tree and make
    // runs order-dependent.
    const dir = await mkdtemp(path.join(tmpdir(), "nexus-e2e-vault-"));
    for (const file of vaultFiles) {
      await writeFile(path.join(dir, file.name), file.body, "utf8");
    }
    await use(dir);
    await rm(dir, { recursive: true, force: true });
  },

  app: async ({ vault }, use) => {
    const userDataDir = await mkdtemp(path.join(tmpdir(), "nexus-e2e-userdata-"));

    // The app restores `lastVault` from userData/vault.json on boot. Seeding
    // that file is what opens our fixture vault — no test-only branch in
    // production code, and it exercises the real restore path.
    await writeFile(
      path.join(userDataDir, "vault.json"),
      JSON.stringify({ lastVault: vault, recents: [vault] }, null, 2),
      "utf8",
    );

    const app = await electron.launch({
      args: [mainEntry, `--user-data-dir=${userDataDir}`],
    });

    await use(app);

    await app.close();
    await rm(userDataDir, { recursive: true, force: true });
  },

  page: async ({ app }, use) => {
    const page = await app.firstWindow();
    // Auto-accept the "discard unsaved changes?" confirm so switching files
    // never blocks the test on a native dialog.
    page.on("dialog", (dialog) => dialog.accept().catch(() => {}));
    // The window is created with `show: false` and revealed on first paint;
    // waiting for the CodeMirror surface is the earliest reliable "ready".
    await page.waitForSelector(".cm-content", { state: "visible" });
    await use(page);
  },
});

export { expect } from "@playwright/test";
