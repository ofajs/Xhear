const { test, expect } = require("@playwright/test");

test("xhear sub object", async ({ page }) => {
  await page.goto("http://localhost:3398/e2e/statics/watch-test.html");

  await page.waitForSelector(".jasmine-suite-detail.jasmine-passed");

  const jasmineSuiteDetails = await page.$$(
    ".jasmine-suite-detail.jasmine-passed"
  );
  expect(jasmineSuiteDetails.length).toBe(1);

  const j2 = await page.$$(".jasmine-specs .jasmine-passed");
  expect(j2.length).toBe(2);
});
