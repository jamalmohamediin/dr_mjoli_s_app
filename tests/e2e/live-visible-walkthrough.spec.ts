import { expect, test } from "@playwright/test";

const STEP_DELAY_MS = 500;

test("Live Visible Walkthrough", async ({ page }) => {
  await test.step("Open The App", async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("body");
    await expect(page.getByText(/Templates|Patients|Reports|Live Report/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await page.waitForTimeout(STEP_DELAY_MS);
  });

  await test.step("Switch To Gastroscopy Or Colonoscopy Tab", async () => {
    const targetTab = page.getByRole("tab", { name: /Gastroscopy|Colonoscopy|Endoscopy/i }).first();

    if (await targetTab.isVisible()) {
      await targetTab.click();
      await page.waitForTimeout(STEP_DELAY_MS);
    }
  });

  await test.step("Fill A Few Visible Text Inputs", async () => {
    const textFields = page.locator(
      "input[type='text'], input[type='search'], input[type='email'], input[type='tel'], input:not([type]), textarea",
    );

    const totalFields = await textFields.count();
    let filledFields = 0;

    for (let index = 0; index < totalFields && filledFields < 3; index += 1) {
      const field = textFields.nth(index);
      if (!(await field.isVisible())) {
        continue;
      }

      try {
        await field.click({ timeout: 1_500 });
        await field.fill(`Playwright Demo ${filledFields + 1}`);
        filledFields += 1;
        await page.waitForTimeout(STEP_DELAY_MS);
      } catch {
        // Skip non-editable controls that present as text fields.
      }
    }

    expect(filledFields).toBeGreaterThan(0);
  });

  await test.step("Confirm Preview Section Is Visible", async () => {
    await expect(page.getByText("Live Report").first()).toBeVisible();
    await page.waitForTimeout(STEP_DELAY_MS);
  });
});
