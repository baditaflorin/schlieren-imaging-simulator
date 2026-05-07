import { expect, test } from "@playwright/test";

test("loads the published site shell", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /get started/i }),
  ).toBeVisible();
});
