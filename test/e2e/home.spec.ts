import { expect, test } from "@playwright/test";

test("loads the simulator and renders a nonblank canvas", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /schlieren imaging simulator/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /github/i })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/schlieren-imaging-simulator",
  );
  await expect(page.getByText(/commit/i)).toBeVisible();

  await page.getByRole("tab", { name: /sound wave/i }).click();
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const target = document.querySelector("canvas");
        if (!target) {
          return 0;
        }
        const width = Math.min(16, target.width);
        const height = Math.min(16, target.height);
        const scratch = document.createElement("canvas");
        scratch.width = width;
        scratch.height = height;
        const context = scratch.getContext("2d");
        if (!context) {
          return 0;
        }
        context.drawImage(target, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;
        let energy = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          energy += pixels[index] + pixels[index + 1] + pixels[index + 2];
        }
        return energy;
      });
    })
    .toBeGreaterThan(1000);
});
