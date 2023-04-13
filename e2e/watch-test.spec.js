const { test, expect } = require("@playwright/test");

test("watch", async ({ page }) => {
  await page.goto("http://localhost:3398/e2e/statics/base-methods-test.html");

  
});
