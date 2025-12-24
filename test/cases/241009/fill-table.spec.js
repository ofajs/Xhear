import { test, expect } from "@playwright/test";

test("fill tr in tbody", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/241009/fill-table.html");

  await page.waitForTimeout(300);

  const tbodyChildLength = await page.evaluate(
    () => $("fill-table").shadow.$("tbody").length
  );

  await expect(tbodyChildLength).toBe(2);
});
