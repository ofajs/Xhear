const { test, expect } = require("@playwright/test");

test("text and html", async ({ page }) => {
  await page.goto("http://localhost:3398/tests/base-test.html");

  const result = await page.waitForFunction(async () => {
    return $("#target1").text;
  });

  await expect(result._preview).toBe("I am target");

  await page.waitForFunction(async () => {
    $("#target1").text = "change text";
    return $("#target1").text;
  });

  await expect(page.getByTestId("target1")).toHaveText("change text");
  
}, 60000);
