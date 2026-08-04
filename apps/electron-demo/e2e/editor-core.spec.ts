import { readFile } from "node:fs/promises";
import path from "node:path";
import { INDEX_MD, NOTES_MD, expect, openFile, test } from "./fixtures";

const status = "#status-line";

test.describe("editor core", () => {
  test("restores the seeded vault and lists its files on boot", async ({ page }) => {
    // The demo restores `lastVault` from userData/vault.json on boot, but the
    // vault panel does not auto-open a document — the editor starts empty and
    // the file tree is what proves the restore path worked.
    await expect(page.locator(".nexus-vault-panel")).toBeVisible();
    await expect(page.locator(`[data-path$="${INDEX_MD}"]`)).toBeVisible();
    await expect(page.locator(`[data-path$="${NOTES_MD}"]`)).toBeVisible();
    await expect(page.locator(".cm-content")).toBeVisible();
  });

  test("opens a file from the tree and shows its markdown source", async ({ page }) => {
    await openFile(page, INDEX_MD);
    await expect(page.locator(".cm-content")).toContainText("Welcome to the vault.");
  });

  test("typing marks the document dirty and updates live stats", async ({ page }) => {
    await openFile(page, INDEX_MD);
    const statusLine = page.locator(status);
    await expect(statusLine).not.toContainText("[modified]");

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+End");
    const before = Number((await statusLine.innerText()).match(/(\d+) words/)?.[1] ?? 0);
    await page.keyboard.type(" Another sentence here.");
    const after = Number((await statusLine.innerText()).match(/(\d+) words/)?.[1] ?? 0);

    await expect(statusLine).toContainText("[modified]");
    expect(after).toBeGreaterThan(before);
  });

  test("Save writes the buffer to disk and clears the dirty flag", async ({ page, vault }) => {
    await openFile(page, INDEX_MD);
    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type("\n\nPersisted by an end-to-end test.");
    await expect(page.locator(status)).toContainText("[modified]");

    // The demo saves via its toolbar "Save" button (Ctrl+S is not bound).
    await page.getByRole("button", { name: /^Save$/ }).click();

    await expect(page.locator(status)).not.toContainText("[modified]");

    const onDisk = await readFile(path.join(vault, INDEX_MD), "utf8");
    expect(onDisk).toContain("Persisted by an end-to-end test.");
  });

  test("markdown source is preserved verbatim across an edit and save", async ({ page, vault }) => {
    // The project's core promise is that markdown text is the source of truth.
    // A round-trip through the live-preview widgets must not rewrite syntax
    // the user never touched.
    await openFile(page, INDEX_MD);
    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type("\n\ntrailing paragraph");
    await page.getByRole("button", { name: /^Save$/ }).click();
    await expect(page.locator(status)).not.toContainText("[modified]");

    const onDisk = await readFile(path.join(vault, INDEX_MD), "utf8");
    expect(onDisk.startsWith("# Index\n\nWelcome to the vault.")).toBe(true);
    expect(onDisk).toContain("trailing paragraph");
  });
});
