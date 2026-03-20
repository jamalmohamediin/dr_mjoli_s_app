import { expect, test } from "@playwright/test";

test("patient records flow supports save, reopen, offline queue, reports, and recycle bin", async ({
  page,
  context,
}) => {
  const suffix = Date.now();
  const patientName = `E2E Patient ${suffix}`;
  const patientId = `E2E-${suffix}`;

  await page.goto("/");
  await page.getByRole("tab", { name: "Appendicectomy" }).click();
  await page.getByPlaceholder("Enter Patient Name").first().fill(patientName);
  await page.getByPlaceholder("Enter Patient ID").first().fill(patientId);

  await page.getByRole("button", { name: "Save Patient Record" }).click();
  await page.getByRole("button", { name: "Patients", exact: true }).click();

  await expect(page.getByText(patientName).first()).toBeVisible();
  await expect(page.getByText(`ID: ${patientId}`).first()).toBeVisible();
  await page
    .getByPlaceholder("Search by name, DOB, procedure, phone, medical aid, hospital, doctor...")
    .fill(patientName);
  const activePatientCard = page.locator('[role="button"]').filter({ hasText: patientName }).first();
  await expect(activePatientCard).toBeVisible();

  await page.getByRole("button", { name: "Edit Saved" }).first().click();
  await expect(page.getByText("Editing saved patient record")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save As New Entry" })).toBeEnabled({
    timeout: 20_000,
  });

  await context.setOffline(true);
  await page.getByRole("button", { name: "Save As New Entry" }).click();
  await page.getByRole("button", { name: "Patients", exact: true }).click();
  await expect(page.getByText("Sync Queue: 1")).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByText("Sync Queue: 0")).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByText("Total Patients")).toBeVisible();
  await page
    .getByRole("button", { name: /Appendicectomy.*View In Patients/ })
    .first()
    .click();

  await expect(page.getByRole("button", { name: "Patients", exact: true })).toBeVisible();
  await page
    .getByPlaceholder("Search by name, DOB, procedure, phone, medical aid, hospital, doctor...")
    .fill(patientName);
  await expect(activePatientCard).toBeVisible();

  await activePatientCard.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Recycle Bin" }).click();
  const deletedPatientCard = page.locator('[role="button"]').filter({ hasText: patientName }).first();
  await expect(deletedPatientCard).toBeVisible();
  await deletedPatientCard.getByRole("button", { name: "Restore" }).click();
  await page.getByRole("button", { name: "Back To Active" }).click();
  await expect(activePatientCard).toBeVisible();
});
