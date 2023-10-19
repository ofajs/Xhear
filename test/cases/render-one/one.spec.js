import { test, expect } from "@playwright/test";

test("render one event", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/render-one/demo.html");

  await expect((await page.getByTestId("count").textContent()).trim()).toBe(
    "count:0"
  );

  await page.getByRole("button", { name: "AddCount" }).click();
  await expect((await page.getByTestId("count").textContent()).trim()).toBe(
    "count:1"
  );

  await page.getByRole("button", { name: "AddCount" }).click();
  await expect((await page.getByTestId("count").textContent()).trim()).toBe(
    "count:1"
  );
});
