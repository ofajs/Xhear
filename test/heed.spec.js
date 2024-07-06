import { test, expect } from "@playwright/test";

test("heed test", async ({ page }) => {
  await page.goto("http://localhost:3398/test/statics/heed.html");
  await page.getByRole("heading", { name: "test-demo 0" }).click();
  await page.getByRole("button", { name: "Count+1" }).click();
  await page.getByRole("button", { name: "Count+1" }).click();
  await page.getByRole("heading", { name: "test-demo 2" }).click();
  await page.getByRole("button", { name: "Set SubCount 100" }).click();
  await page.getByRole("heading", { name: "test-demo 100" }).click();
  await page.getByRole("button", { name: "Count+1" }).click();
  await page.getByRole("heading", { name: "test-demo 3" }).click();
});
