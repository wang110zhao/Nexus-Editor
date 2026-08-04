import { INDEX_MD, expect, openFile, test } from "./fixtures";

// Live preview is the feature most likely to regress: decorations are rebuilt
// on every selection change, and the 12 table-widget rules in CLAUDE.md exist
// because this surface has broken repeatedly. Unit tests cover the range math;
// these cover what the user actually sees in a real Chromium window.
test.use({
  vaultFiles: [
    {
      name: INDEX_MD,
      body: [
        "# Heading one",
        "",
        "Some **bold** and *italic* text.",
        "",
        "| col a | col b |",
        "| --- | --- |",
        "| 1 | 2 |",
        "",
        "- [ ] pending task",
        "",
      ].join("\n"),
    },
  ],
});

// The app does not auto-open a document; load the fixture file first so the
// live-preview decorations have something to render.
test.beforeEach(async ({ page }) => {
  await openFile(page, INDEX_MD);
});

test.describe("live preview", () => {
  test("hides heading markers until the cursor enters the line", async ({ page }) => {
    const content = page.locator(".cm-content");
    await expect(content).toContainText("Heading one");

    // Cursor starts away from the heading, so the `#` prefix is decorated out.
    await content.click();
    await page.keyboard.press("Control+End");

    const firstLine = page.locator(".cm-line").first();
    await expect(firstLine).not.toContainText("# Heading one");
    await expect(firstLine).toContainText("Heading one");
  });

  test("reveals raw markdown when the cursor moves onto the line", async ({ page }) => {
    const content = page.locator(".cm-content");
    await content.click();
    await page.keyboard.press("Control+End");

    const firstLine = page.locator(".cm-line").first();
    await expect(firstLine).not.toContainText("# Heading one");

    await page.keyboard.press("Control+Home");

    await expect(firstLine).toContainText("# Heading one");
  });

  test("renders a GFM table as a widget", async ({ page }) => {
    await expect(page.locator(".cm-content table")).toHaveCount(1);
    await expect(page.locator(".cm-content table td").first()).toBeVisible();
  });

  test("renders task list checkboxes", async ({ page }) => {
    await expect(page.locator('.cm-content input[type="checkbox"]')).toHaveCount(1);
  });
});
