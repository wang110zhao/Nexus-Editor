import { readFile } from "node:fs/promises";
import path from "node:path";
import { INDEX_MD, NOTES_MD, expect, openFile, test } from "./fixtures";

const status = "#status-line";

test.describe("vault navigation", () => {
  test("lists vault files and switches the active document", async ({ page }) => {
    await expect(page.locator(`[data-path$="${NOTES_MD}"]`)).toBeVisible();

    await openFile(page, NOTES_MD);

    await expect(page.locator(status)).toContainText(NOTES_MD);
    await expect(page.locator(".cm-content")).toContainText("first");
  });

  test("keeps per-file edits isolated when switching back and forth", async ({ page, vault }) => {
    await openFile(page, INDEX_MD);
    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type("\n\nedit in index");
    await page.getByRole("button", { name: /^Save$/ }).click();
    await expect(page.locator(status)).not.toContainText("[modified]");

    await openFile(page, NOTES_MD);
    await expect(page.locator(status)).toContainText(NOTES_MD);

    await page.locator(".cm-content").click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type("\n\nedit in notes");
    await page.getByRole("button", { name: /^Save$/ }).click();
    await expect(page.locator(status)).not.toContainText("[modified]");

    const indexBody = await readFile(path.join(vault, INDEX_MD), "utf8");
    const notesBody = await readFile(path.join(vault, NOTES_MD), "utf8");

    expect(indexBody).toContain("edit in index");
    expect(indexBody).not.toContain("edit in notes");
    expect(notesBody).toContain("edit in notes");
    expect(notesBody).not.toContain("edit in index");
  });
});
