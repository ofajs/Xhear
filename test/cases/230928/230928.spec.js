import { test, expect } from "@playwright/test";

test("fill string item", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/230928/fill-link.html");

  await page.waitForTimeout(60);

  expect(await page.$eval("li", (node) => node.textContent)).toBe(
    "en/index.html"
  );

  await page.waitForTimeout(400);

  expect(await page.$eval("li", (node) => node.textContent)).toBe(
    "cn/index.html"
  );
});
