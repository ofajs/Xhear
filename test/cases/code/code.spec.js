import { test, expect } from "@playwright/test";

test("normal recovery", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/code/demo.html");

  await page.waitForTimeout(60);

  expect(await page.$eval("code", (node) => node.textContent.trim())).toBe(
    `<div class:code="asdasd">{{count}}</div>`
  );
});
