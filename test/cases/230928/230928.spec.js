import { test, expect } from "@playwright/test";

test("fill string item", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/230928/fill-link.html");

  await new Promise((res) => setTimeout(res, 50));

  expect(await page.$eval("li", (node) => node.textContent)).toBe(
    "en/index.html"
  );

  await new Promise((res) => setTimeout(res, 400));

  expect(await page.$eval("li", (node) => node.textContent)).toBe(
    "cn/index.html"
  );
});
