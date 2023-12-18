import { test, expect } from "@playwright/test";

test("sync uppercase", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/sync-uppercase/demo.html");

  await expect((await page.getByTestId("t1").textContent()).trim()).toBe(
    "t-one: 0"
  );
  await expect((await page.getByTestId("t2").textContent()).trim()).toBe(
    "t-two: 0"
  );

  await page.getByRole("button", { name: "AddCount" }).click();

  await new Promise((res) => setTimeout(res, 100));

  await expect((await page.getByTestId("t1").textContent()).trim()).toBe(
    "t-one: 1"
  );
  await expect((await page.getByTestId("t2").textContent()).trim()).toBe(
    "t-two: 1"
  );

  await page.getByTestId("t2").click();

  await new Promise((res) => setTimeout(res, 100));

  await expect((await page.getByTestId("t1").textContent()).trim()).toBe(
    "t-one: 2"
  );
  await expect((await page.getByTestId("t2").textContent()).trim()).toBe(
    "t-two: 2"
  );
});
