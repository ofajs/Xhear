import { test, expect } from "@playwright/test";

test("normal recovery", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/code/demo.html");

  await new Promise((res) => setTimeout(res, 100));

  expect(await page.$eval("code", (node) => node.textContent.trim())).toBe(
    `<div class:code="asdasd">{{count}}</div>`
  );
});
