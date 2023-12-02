import { test, expect } from "@playwright/test";

test("set-data-before-init", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/cases/set-data-before-init/demo.html"
  );

  await new Promise((res) => setTimeout(res, 500));

  const { _preview: data } = await page.waitForFunction(async () => {
    return getComputedStyle(document.getElementById("target")).color;
  });

  await expect(data).toBe("rgb(0, 128, 0)");
});
