const { test, expect } = require("@playwright/test");

test("stanz", async ({ page }) => {
  await page.goto("http://localhost:3398/e2e/statics/stanz-test.html");

  await page.waitForSelector(".jasmine-suite-detail.jasmine-passed");

  const jasmineSuiteDetails = await page.$$(
    ".jasmine-suite-detail.jasmine-passed"
  );

  expect(jasmineSuiteDetails.length).toBe(4);
});

test("xhear sub object", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/e2e/statics/xhear-sub-object-test.html"
  );

  await page.waitForSelector(".jasmine-suite-detail.jasmine-passed");

  const jasmineSuiteDetails = await page.$$(
    ".jasmine-suite-detail.jasmine-passed"
  );

  expect(jasmineSuiteDetails.length).toBe(3);
});
