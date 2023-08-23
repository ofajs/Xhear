const { test, expect } = require("@playwright/test");

test("bug: x-if the first time it renders multiple", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/230810/x-if-bug.html");

  await new Promise((res) => setTimeout(res, 100));

  const childsLen = await page.$eval("#condition-container", (node) => {
    return node.children.length;
  });

  expect(childsLen).toBe(1);
});
